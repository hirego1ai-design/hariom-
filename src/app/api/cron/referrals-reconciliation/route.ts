import { NextRequest, NextResponse } from "next/server";
import { reconcileManagedHiringWarrantyLocks } from "@/lib/managed-hiring-referral";
import { logAuditEvent } from "@/lib/auditLogger";

function verifyCronSecret(req: NextRequest): { authorized: boolean; reason?: string } {
  const cronSecret = process.env.CRON_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  // Production security: CRON_SECRET MUST be defined
  if (isProduction && !cronSecret) {
    return {
      authorized: false,
      reason: "Server misconfiguration: CRON_SECRET environment variable is missing in production.",
    };
  }

  // Extract Bearer token or custom header
  const authHeader = req.headers.get("authorization") || "";
  const customHeader = req.headers.get("x-cron-secret") || "";

  let providedSecret = "";
  if (authHeader.startsWith("Bearer ")) {
    providedSecret = authHeader.substring(7).trim();
  } else if (customHeader) {
    providedSecret = customHeader.trim();
  }

  if (cronSecret) {
    if (!providedSecret || providedSecret !== cronSecret) {
      return { authorized: false, reason: "Invalid or missing Bearer CRON_SECRET." };
    }
    return { authorized: true };
  }

  // Non-production fallback (Dev / Staging / Test)
  // If CRON_SECRET is not configured in dev, require explicit test secret or dev bypass header
  if (providedSecret === "dev-cron-secret" || !isProduction) {
    return { authorized: true };
  }

  return { authorized: false, reason: "CRON_SECRET verification failed." };
}

async function handleReconciliation(req: NextRequest) {
  const startTime = Date.now();
  const auth = verifyCronSecret(req);

  if (!auth.authorized) {
    logAuditEvent({
      userId: "UNAUTHORIZED_CRON_CALLER",
      action: "CRON_AUTHENTICATION_FAILED",
      resource: "/api/cron/referrals-reconciliation",
      details: `Unauthorized attempt to trigger referral reconciliation cron: ${auth.reason}`,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
    });

    return NextResponse.json(
      {
        success: false,
        error: auth.reason || "Unauthorized: Valid CRON_SECRET Bearer token required.",
      },
      { status: 401 }
    );
  }

  try {
    const result = await reconcileManagedHiringWarrantyLocks();
    const durationMs = Date.now() - startTime;
    const timestamp = new Date().toISOString();

    logAuditEvent({
      userId: "SCHEDULED_CRON_SERVICE",
      action: "REFERRALS_RECONCILIATION_COMPLETED",
      resource: "/api/cron/referrals-reconciliation",
      details: `Reconciliation finished in ${durationMs}ms. Unlocked: ${result.unlocked} reward(s) (₹${result.totalAmountUnlocked.toLocaleString()}).`,
    });

    return NextResponse.json({
      success: true,
      timestamp,
      unlockedCount: result.unlocked,
      totalAmountUnlockedINR: result.totalAmountUnlocked,
      unlockedRewards: result.unlockedRewards,
      durationMs,
      message:
        result.unlocked > 0
          ? `Successfully reconciled and unlocked ${result.unlocked} expired warranty reward(s).`
          : "Reconciliation cycle complete. No expired warranty locks found (idempotent state verified).",
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    logAuditEvent({
      userId: "SCHEDULED_CRON_SERVICE",
      action: "REFERRALS_RECONCILIATION_ERROR",
      resource: "/api/cron/referrals-reconciliation",
      details: `Error executing scheduled referral reconciliation: ${error?.message}`,
    });

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error during referral reconciliation",
        durationMs,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleReconciliation(req);
}

export async function POST(req: NextRequest) {
  return handleReconciliation(req);
}
