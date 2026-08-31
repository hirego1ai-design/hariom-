import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession, type UserSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, jsonError, readValidatedJson } from "@/lib/apiSecurity";
import { getSessionCompany, requireEmployerOrAdminSession } from "@/lib/routeAuthorization";
import { sendEmail } from "@/lib/email";
import { logAuditEvent } from "@/lib/auditLogger";

const inviteSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  designation: z.string().trim().max(100).optional(),
  role: z.enum(["RECRUITER", "EMPLOYER"]).default("RECRUITER"),
});

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, "employer_team_get", 60, 60000);
    const session = await requireEmployerOrAdminSession(req);

    let companyId: string;
    if (session.role === "ADMIN") {
      const url = new URL(req.url);
      const queryCompanyId = url.searchParams.get("companyId");
      if (!queryCompanyId) {
        return jsonError("companyId query parameter is required for administrators", 400);
      }
      companyId = queryCompanyId;
    } else {
      const company = await getSessionCompany(session);
      companyId = company.id;
    }

    const [team, pendingInvitations] = await Promise.all([
      prisma.employerProfile.findMany({
        where: { companyId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatarUrl: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.companyInvitation.findMany({
        where: {
          companyId,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          designation: true,
          status: true,
          expiresAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      team: team.map((member) => ({
        id: member.id,
        userId: member.user?.id,
        name: member.user?.name || "Team Member",
        email: member.user?.email,
        role: member.user?.role,
        designation: member.designation || "Recruiter",
        status: "ACTIVE",
        joinedAt: member.createdAt,
      })),
      invitations: pendingInvitations,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, "employer_team_invite", 15, 60000);
    const session = await requireEmployerOrAdminSession(req);

    // Only company owner/employers and admins can send invitations
    if (session.role !== "EMPLOYER" && session.role !== "ADMIN") {
      throw new ApiError("Only company administrators or owners can invite team members.", 403);
    }

    const body = await readValidatedJson(req, inviteSchema);
    const normalizedEmail = body.email.toLowerCase().trim();

    let companyId: string;
    let companyName: string;

    if (session.role === "ADMIN") {
      const url = new URL(req.url);
      const queryCompanyId = url.searchParams.get("companyId");
      if (!queryCompanyId) {
        throw new ApiError("companyId parameter required for administrator invitation dispatch.", 400);
      }
      const companyRecord = await prisma.company.findUnique({ where: { id: queryCompanyId } });
      if (!companyRecord) throw new ApiError("Company not found.", 404);
      companyId = companyRecord.id;
      companyName = companyRecord.name;
    } else {
      const company = await getSessionCompany(session);
      companyId = company.id;
      companyName = company.name;
    }

    // 1. Check if user is already an active member of this company's team
    const existingMember = await prisma.employerProfile.findFirst({
      where: {
        companyId,
        user: { email: normalizedEmail },
      },
    });

    if (existingMember) {
      throw new ApiError("This user is already a member of your company team.", 400);
    }

    // 2. Check for active duplicate invitation
    const existingPending = await prisma.companyInvitation.findFirst({
      where: {
        companyId,
        email: normalizedEmail,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingPending) {
      throw new ApiError("An active invitation is already pending for this email address.", 409);
    }

    // 3. Generate secure cryptographic token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // 4. Create invitation record in PostgreSQL
    const invitation = await prisma.companyInvitation.create({
      data: {
        companyId,
        email: normalizedEmail,
        name: body.name,
        role: body.role,
        designation: body.designation,
        tokenHash,
        status: "PENDING",
        invitedById: session.id,
        expiresAt,
      },
    });

    // 5. Build secure acceptance link & dispatch email
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://hirego.ai";
    const inviteUrl = `${baseUrl}/employer/invitation/accept?token=${rawToken}`;

    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: `Invitation to join ${companyName} on HireGo`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0A0A0C; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #448AFF; margin-top: 0;">Team Invitation</h2>
          <p style="color: #E0E0E0; font-size: 16px; line-height: 1.5;">
            Hello <strong>${body.name}</strong>,
          </p>
          <p style="color: #9CA3AF; line-height: 1.6;">
            You have been invited by <strong>${session.name}</strong> to join <strong>${companyName}</strong> on HireGo as a <strong>${body.role}</strong>${body.designation ? ` (${body.designation})` : ""}.
          </p>
          <div style="margin: 28px 0;">
            <a href="${inviteUrl}" style="background-color: #448AFF; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
              Accept Invitation & Join Team
            </a>
          </div>
          <p style="color: #6B7280; font-size: 13px; line-height: 1.4;">
            This invitation link is single-use and will expire in 7 days (on ${expiresAt.toLocaleDateString()}). If you did not expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (!emailResult.success) {
      // Rollback database record if email provider failed or is unconfigured
      await prisma.companyInvitation.delete({ where: { id: invitation.id } }).catch(() => undefined);
      throw new ApiError("Email delivery failed or no active email provider is configured. Invitation was not dispatched.", 502);
    }

    await logAuditEvent({
      userId: session.id,
      companyId,
      action: "INVITATION_CREATED",
      resource: `Invitation:${invitation.id}`,
      details: `Invited ${normalizedEmail} as ${body.role} (${body.designation || "No Designation"})`,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Invitation successfully sent to ${normalizedEmail}`,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          name: invitation.name,
          role: invitation.role,
          designation: invitation.designation,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await enforceRateLimit(req, "employer_team_delete", 20, 60000);
    const session = await requireEmployerOrAdminSession(req);

    if (session.role !== "EMPLOYER" && session.role !== "ADMIN") {
      throw new ApiError("Only company administrators or owners can manage team access.", 403);
    }

    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get("id");

    if (!targetId) {
      throw new ApiError("Target member or invitation ID is required.", 400);
    }

    let companyId: string | undefined;
    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      companyId = company.id;
    }

    // 1. Check if target is a CompanyInvitation to revoke
    const invitation = await prisma.companyInvitation.findUnique({
      where: { id: targetId },
    });

    if (invitation) {
      if (companyId && invitation.companyId !== companyId) {
        throw new ApiError("Forbidden: Cannot revoke an invitation for another company.", 403);
      }

      await prisma.companyInvitation.update({
        where: { id: targetId },
        data: {
          status: "REVOKED",
          revokedAt: new Date(),
        },
      });

      await logAuditEvent({
        userId: session.id,
        companyId: invitation.companyId,
        action: "INVITATION_REVOKED",
        resource: `Invitation:${targetId}`,
        details: `Revoked pending invitation for ${invitation.email}`,
        ipAddress: req.headers.get("x-forwarded-for") || undefined,
      });

      return NextResponse.json({
        success: true,
        message: "Invitation successfully revoked.",
      });
    }

    // 2. Check if target is an EmployerProfile team member
    const member = await prisma.employerProfile.findUnique({
      where: { id: targetId },
      include: { user: true },
    });

    if (member) {
      if (companyId && member.companyId !== companyId) {
        throw new ApiError("Forbidden: Cannot remove a member from another company.", 403);
      }

      // Prevent removing self if the user is the sole team member
      const memberCount = await prisma.employerProfile.count({
        where: { companyId: member.companyId },
      });

      if (memberCount <= 1) {
        throw new ApiError("Cannot remove the last remaining company team member.", 400);
      }

      await prisma.employerProfile.delete({
        where: { id: targetId },
      });

      await logAuditEvent({
        userId: session.id,
        companyId: member.companyId,
        action: "TEAM_MEMBER_REMOVED",
        resource: `EmployerProfile:${targetId}`,
        details: `Removed team member ${member.user?.email || targetId}`,
        ipAddress: req.headers.get("x-forwarded-for") || undefined,
      });

      return NextResponse.json({
        success: true,
        message: "Team member access successfully removed.",
      });
    }

    throw new ApiError("Target team member or invitation not found.", 404);
  } catch (error) {
    return handleApiError(error);
  }
}
