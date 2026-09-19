import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, enforceRateLimit, getClientIp, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { hashPassword, validatePasswordStrength, revokeAllUserSessions } from "@/lib/auth";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const acceptInvitationSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i, "Invalid invitation token"),
  password: z.string().min(8).max(200).optional(),
  name: z.string().trim().min(2).max(100).optional(),
}).strict();

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

    // 2. Process acceptance inside one serialized transaction. The invitation
    // row is locked so concurrent uses of the same single-use token cannot both
    // create/update membership.
    const acceptance = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "CompanyInvitation" WHERE id = ${invitation.id} FOR UPDATE`;
      const currentInvitation = await tx.companyInvitation.findUnique({
        where: { id: invitation.id },
        include: { company: true },
      });
      if (!currentInvitation || currentInvitation.status !== "PENDING") {
        throw new ApiError("Invalid, revoked, or already consumed invitation token.", 400);
      }
      if (currentInvitation.expiresAt < new Date()) {
        await tx.companyInvitation.update({ where: { id: currentInvitation.id }, data: { status: "EXPIRED" } });
        throw new ApiError("This invitation has expired. Please ask your company administrator to send a new invitation.", 400);
      }

      const existingUser = await tx.user.findUnique({
        where: { email: currentInvitation.email },
      });

      let userId: string;
      let roleChanged = false;
      let newSessionVersion: number | null = null;

      if (existingUser) {
        userId = existingUser.id;

        // Check if user already has an EmployerProfile
        const existingEmployer = await tx.employerProfile.findUnique({
          where: { userId: existingUser.id },
        });

        if (existingEmployer) {
          // Reject cross-company transfer by default to prevent silent moving or hijacking
          if (existingEmployer.companyId !== currentInvitation.companyId) {
            throw new ApiError("This account is already registered to another company. Cross-company transfers are not permitted.", 400);
          }

          // Existing member in the same company: update designation if specified
          await tx.employerProfile.update({
            where: { userId: existingUser.id },
            data: {
              designation: currentInvitation.designation || existingEmployer.designation,
            },
          });
        } else {
          // No employer profile exists yet (could be a CANDIDATE user)
          await tx.employerProfile.create({
            data: {
              userId: existingUser.id,
              companyId: currentInvitation.companyId,
              designation: currentInvitation.designation,
            },
          });
        }

        // Set user role exactly to the invitation role.
        // This prevents privilege escalation (e.g. keeping EMPLOYER role when invited as RECRUITER)
        // or promotes a CANDIDATE to the appropriate role.
        roleChanged = existingUser.role !== currentInvitation.role;
        newSessionVersion = existingUser.sessionVersion + 1;

        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            role: currentInvitation.role,
            // Rotate session version to invalidate active sessions if privilege/role changes
            sessionVersion: roleChanged ? newSessionVersion : undefined,
          },
        });


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
            email: currentInvitation.email,
            name: body.name || currentInvitation.name,
            passwordHash,
            role: currentInvitation.role,
            emailVerified: true,
            sessionVersion: 0,
          },
        });

        userId = newUser.id;

        await tx.employerProfile.create({
          data: {
            userId: newUser.id,
            companyId: currentInvitation.companyId,
            designation: currentInvitation.designation,
          },
        });
      }

      const consumed = await tx.companyInvitation.updateMany({
        where: { id: currentInvitation.id, status: "PENDING" },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });
      if (consumed.count !== 1) throw new ApiError("Invitation was already consumed.", 409);

      const auditLog = await tx.auditLog.create({
        data: {
          userId,
          companyId: currentInvitation.companyId,
          action: "INVITATION_ACCEPTED",
          resource: `Invitation:${currentInvitation.id}`,
          details: `Invitation accepted by ${currentInvitation.email} for company ${currentInvitation.company.name} as role ${currentInvitation.role}`,
          ipAddress: getClientIp(req),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, userId);
      return { userId, roleChanged, newSessionVersion, companyName: currentInvitation.company.name };
    });

    if (acceptance.roleChanged && acceptance.newSessionVersion !== null) {
      // Database sessionVersion is authoritative in production. Refresh Redis
      // after commit, but never turn a committed invitation into an apparent
      // failure if cache refresh is temporarily unavailable.
      await revokeAllUserSessions(acceptance.userId, acceptance.newSessionVersion).catch((error) => {
        console.error("INVITATION_SESSION_CACHE_REFRESH_FAILED", { userId: acceptance.userId, error });
      });
    }

    return NextResponse.json({
      success: true,
      message: `You have successfully joined ${acceptance.companyName}. You may now sign in.`,
      companyName: acceptance.companyName,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
