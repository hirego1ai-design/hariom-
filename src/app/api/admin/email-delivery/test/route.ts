import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { EMAIL_PROVIDERS } from "@/lib/email-delivery-config";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";

const testSchema = z.object({
  email: z.string().email("Enter a valid test email address."),
  provider: z.enum(EMAIL_PROVIDERS).optional(),
});

export async function POST(request: Request) {
  try {
    const admin = getCurrentSession(request.headers);
    if (!admin || admin.role !== "ADMIN") throw new ApiError("Unauthorized: Admin role required.", 401);
    enforceRateLimit(request, `admin_email_delivery_test:${admin.id}`, 3, 10 * 60_000);
    const body = await readValidatedJson(request, testSchema);
    const result = await sendEmail({
      to: body.email,
      subject: "HireGo AI — Email delivery test",
      text: "This is a transactional email delivery test from HireGo AI.",
      html: "<p>This is a transactional email delivery test from <strong>HireGo AI</strong>.</p>",
    }, { provider: body.provider, allowFallback: false });

    if (!result.success) {
      return NextResponse.json({ success: false, error: "The selected provider could not deliver the test email. Check its sender address and API token." }, { status: 502 });
    }
    return NextResponse.json({ success: true, message: `Test email accepted by ${result.provider}.`, provider: result.provider, messageId: result.messageId });
  } catch (error) {
    return handleApiError(error);
  }
}
