import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { generateAndSendOtp } from "@/lib/otp";
import { enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: Request) {
  try {
    enforceRateLimit(request, "auth_forgot_password");
    const body = await readValidatedJson(request, forgotPasswordSchema);

    const user = await db.findUserByEmail(body.email);
    if (!user) {
      // Return success anyway for security / avoid email enumeration
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a verification code has been sent.",
      });
    }

    const result = await generateAndSendOtp(body.email, "RESET_PASSWORD");

    return NextResponse.json({
      success: true,
      message: result.message,
      debugOtp: result.debugOtp,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
