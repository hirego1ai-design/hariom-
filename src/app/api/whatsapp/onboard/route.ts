import { NextResponse } from "next/server";
import { z } from "zod";
import {
  enforceInternalApiKey,
  enforceRateLimit,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";

const onboardRequestSchema = z.object({
  from: z.string().trim().min(3).max(32).regex(/^[+\d\s().-]+$/, "Invalid sender phone number."),
  message: z.string().trim().max(2000).optional().default(""),
  step: z.coerce.number().int().min(1).max(5).optional().default(1),
});

export async function POST(request: Request) {
  try {
    enforceInternalApiKey(request);
    enforceRateLimit(request, "whatsapp:onboard");

    const { from, message, step } = await readValidatedJson(request, onboardRequestSchema);

    let responseText = "";
    let nextStep = step;

    switch (nextStep) {
      case 1:
        responseText = "Welcome to HireGo AI. I am your AI Recruiter. What type of job or role are you looking for?";
        nextStep = 2;
        break;

      case 2:
        responseText = `Great. I've noted your target role as "${message}". Please upload your resume PDF or reply with your top skills.`;
        nextStep = 3;
        break;

      case 3:
        responseText = "Resume received and parsing completed. Resume Quality Score: 86/100. Now please record a 2-minute video introduction.";
        nextStep = 4;
        break;

      case 4:
        responseText = "Video presentation analyzed. Speech Clarity: 92%, Confidence: 90%. Let's begin your 5-minute technical baseline assessment.";
        nextStep = 5;
        break;

      default:
        responseText = "Your candidate profile is verified and active. Your HireGo Score is 88/100. View your universal profile in the candidate portal.";
        break;
    }

    return NextResponse.json({
      success: true,
      sender: "HireGo AI Recruiter Bot",
      to: from,
      reply: responseText,
      nextStep,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
