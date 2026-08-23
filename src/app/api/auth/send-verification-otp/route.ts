import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { generateAndSendOtp } from "@/lib/otp";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";

const schema = z.object({ email: z.string().email("Invalid email address") });

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "auth_send_verification_otp", 5, 15 * 60_000);
    const { email } = await readValidatedJson(request, schema);
    const user = await db.findUserByEmail(email);
    // Keep the response indistinguishable for unknown addresses.
    if (!user || ("emailVerified" in user && user.emailVerified)) {
      return NextResponse.json({ success: true, message: "If this account requires verification, a code has been sent." });
    }
    const result = await generateAndSendOtp(email, "VERIFY_EMAIL");
    return NextResponse.json({ success: true, message: result.message, debugOtp: result.debugOtp });
  } catch (error) {
    return handleApiError(error);
  }
}
