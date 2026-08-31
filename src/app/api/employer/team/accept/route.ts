import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { hashPassword, validatePasswordStrength } from "@/lib/auth";
import { logAuditEvent } from "@/lib/auditLogger";

const acceptInvitationSchema = z.object({
  token: z.string().min(16, "Invalid invitation token"),
  password: z.string().optional(),
  name: z.string().trim().min(2).max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, "employer_team_accept_invitation", 10, 60000);
    const body = await readValidatedJson(req, acceptInvitationSchema);

    // 1. Calculate SHA-256 hash of provided token to lookup record
    const tokenHash = crypto.createHash("sha256").update(body.token).digest("hex");

    const invitation = await prisma.companyInvitation.findUnique({
      where: { tokenHash },
      include: { company: true },
    });

    if (!invitation || invitation.status !== "PENDING") {
      throw new ApiError("Invalid, revoked, or already consumed invitation token.", 400);
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.companyInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      }).catch(() => undefined);
      throw new ApiError("This invitation has expired. Please ask your company administrator to send a new invitation.", 400);
    }

    // 2. Process acceptance inside atomic transaction
    await prisma.$transaction(async (tx) => {
      // Find existing user by invitation email
      const existingUser = await tx.user.findUnique({
        where: { email: invitation.email },
      });

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
        // Check if user already has an EmployerProfile linked to this company
        const existingEmployer = await tx.employerProfile.findUnique({
          where: { userId: existingUser.id },
        });

        if (existingEmployer) {
          if (existingEmployer.companyId !== invitation.companyId) {
            // Update companyId and designation
            await tx.employerProfile.update({
              where: { userId: existingUser.id },
              data: {
                companyId: invitation.companyId,
                designation: invitation.designation || existingEmployer.designation,
              },
            });
          }
        } else {
          // Create employer profile
          await tx.employerProfile.create({
            data: {
              userId: existingUser.id,
              companyId: invitation.companyId,
              designation: invitation.designation,
            },
          });
        }

        // If user role was CANDIDATE, promote to the invitation role
        if (existingUser.role === "CANDIDATE") {
          await tx.user.update({
            where: { id: existingUser.id },
            data: { role: invitation.role },
          });
        }
      } else {
        // New user creation requires a valid password
        if (!body.password) {
          throw new ApiError("A password is required to create your new team member account.", 400);
        }

        const passwordValidation = validatePasswordStrength(body.password);
        if (!passwordValidation.valid) {
          throw new ApiError(passwordValidation.message || "Password is not strong enough.", 400);
        }

        const passwordHash = hashPassword(body.password);

        const newUser = await tx.user.create({
          data: {
            email: invitation.email,
            name: body.name || invitation.name,
            passwordHash,
            role: invitation.role,
            emailVerified: true, // Email verified through invitation token delivery
          },
        });

        userId = newUser.id;

        await tx.employerProfile.create({
          data: {
            userId: newUser.id,
            companyId: invitation.companyId,
            designation: invitation.designation,
          },
        });
      }

      // Mark invitation as ACCEPTED
      await tx.companyInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });

      await logAuditEvent({
        userId,
        companyId: invitation.companyId,
        action: "INVITATION_ACCEPTED",
        resource: `Invitation:${invitation.id}`,
        details: `Invitation accepted by ${invitation.email} for company ${invitation.company.name}`,
        ipAddress: req.headers.get("x-forwarded-for") || undefined,
      });
    });

    return NextResponse.json({
      success: true,
      message: `You have successfully joined ${invitation.company.name}. You may now sign in.`,
      companyName: invitation.company.name,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
