import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { referralDb } from "@/lib/referral-db";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { sendEmail } from "@/lib/email";
import { FraudStatus } from "@/types/referral";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[character] || character));
}

const inviteSchema = z.object({
  action: z.literal("INVITE"),
  email: z.string().trim().email().max(320),
  name: z.string().trim().min(1).max(160).optional(),
}).strict();

export async function GET(request: Request) {
  try {
    await enforceRateLimit(request, "referrals_get", 30, 60000);

    const session = await getCurrentSession(request.headers);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }

    // IDOR Protection: Reject tampering with query parameters or headers
    const url = new URL(request.url);
    const queryUserId = url.searchParams.get("userId") || url.searchParams.get("referrerId");
    if (queryUserId && queryUserId !== session.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cannot access referral stats for another user" },
        { status: 403 }
      );
    }

    const headerUserId = request.headers.get("x-user-id");
    if (headerUserId && headerUserId !== session.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Header tampering detected" },
        { status: 403 }
      );
    }

    const stats = await referralDb.getUserReferralStats(session.id, session.name);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "referrals_invite", 10, 60000);

    const session = await getCurrentSession(request.headers);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }

    // Fraud Gate: Check if user's account is under fraud hold
    const fraud = await referralDb.getUserFraudProfile(session.id);
    if (fraud.status === FraudStatus.FRAUD_HOLD) {
      return NextResponse.json(
        { success: false, error: "Account referral actions are suspended on FRAUD_HOLD." },
        { status: 403 }
      );
    }

    const body = await readValidatedJson(request, inviteSchema, 8 * 1024);
    const stats = await referralDb.getUserReferralStats(session.id, session.name);
    if (!stats.programEnabled) {
      throw new ApiError("Referral invitations are currently paused by program configuration.", 409);
    }

    const inviterName = session.name?.trim() || "A HireGo member";
    const inviteeName = body.name?.trim() || "there";
    const emailResult = await sendEmail({
      to: body.email,
      subject: `${inviterName} invited you to HireGo AI`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:28px;background:#0A0A0C;color:#ffffff;border-radius:12px">
          <h2 style="margin-top:0;color:#448AFF">HireGo AI referral invitation</h2>
          <p style="color:#E5E7EB">Hello <strong>${escapeHtml(inviteeName)}</strong>,</p>
          <p style="color:#9CA3AF;line-height:1.6"><strong>${escapeHtml(inviterName)}</strong> invited you to explore HireGo AI.</p>
          <p style="margin:24px 0"><a href="${escapeHtml(stats.referralLink)}" style="display:inline-block;background:#448AFF;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Open HireGo AI</a></p>
          <p style="color:#6B7280;font-size:12px">Referral eligibility and rewards, if any, are determined by the current server-side referral program rules.</p>
        </div>
      `,
    });
    if (!emailResult.success) {
      throw new ApiError("The email provider did not accept this referral invitation. No sent-invite success was recorded.", 502);
    }

    const attr = await referralDb.createAttribution({
      referrerId: session.id,
      referralCode: stats.referralCode,
      attributionSource: "DIRECT_EMAIL_INVITE",
      referredEmail: body.email,
      metadata: { inviteeEmail: body.email, inviteeName: body.name || null, emailProviderAccepted: true },
    });

    return NextResponse.json({
      success: true,
      message: `Referral invitation accepted by the email provider for ${body.email}.`,
      attributionId: attr.id,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
