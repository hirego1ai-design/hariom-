import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";

const verifySchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i, "Invalid invitation token format"),
}).strict();

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, "employer_invitations_verify", 20, 60000);

    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      throw new ApiError("Invitation token is required.", 400);
    }

    // Validate token format
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      throw new ApiError("Invalid invitation token format.", 400);
    }

    // Calculate SHA-256 hash of provided token to lookup record
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const invitation = await prisma.companyInvitation.findUnique({
      where: { tokenHash },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Invalid invitation token." },
        { status: 404 }
      );
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "This invitation has already been used or was revoked." },
        { status: 410 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      // Update status to EXPIRED
      await prisma.companyInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      }).catch(() => undefined);

      return NextResponse.json(
        { success: false, error: "This invitation has expired." },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      id: invitation.id,
      company: {
        name: invitation.company.name,
      },
      role: invitation.role,
      email: invitation.email,
      name: invitation.name,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
