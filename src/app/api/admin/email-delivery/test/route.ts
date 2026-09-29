import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { sendEmail } from "@/lib/email";
import { EMAIL_PROVIDERS } from "@/lib/email-delivery-config";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logCriticalAuditEvent } from "@/lib/auditLogger";

const testSchema = z.object({
  email: z.string().email("Enter a valid test email address."),
  provider: z.enum(EMAIL_PROVIDERS).optional(),
}).strict();

export async function POST(request: Request) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_email_delivery_test:${admin.id}`, 3, 10 * 60_000);
    const body = await readValidatedJson(request, testSchema, 4 * 1024);

    if (process.env.NODE_ENV === "production") {
      const allowlist = (process.env.COMMUNICATION_TEST_RECIPIENT_ALLOWLIST || "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
      if (!allowlist.length || !allowlist.includes(body.email.trim().toLowerCase())) {
        throw new ApiError(
          "Production test sends are restricted to the configured recipient allowlist.",
          403,
        );
      }
    }

    const testId = `email-provider-test:${admin.id}:${crypto.randomUUID()}`;
    await logCriticalAuditEvent({
      userId: admin.id,
      action: "EMAIL_PROVIDER_TEST_REQUESTED",
      resource: `EmailProviderTest:${testId}`,
      details: `provider=${body.provider || "configured-primary"}`,
    });

    const result = await sendEmail(
      {
        to: body.email,
        subject: "HireGo AI — Email delivery test",
        text: "This is a transactional email delivery test from HireGo AI.",
        html: "<p>This is a transactional email delivery test from <strong>HireGo AI</strong>.</p>",
      },
      { provider: body.provider, allowFallback: false },
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "The selected provider could not accept the test email. Check its sender address and API token.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email accepted by ${result.provider}. Delivery/read confirmation is separate.`,
      provider: result.provider,
      messageId: result.messageId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
