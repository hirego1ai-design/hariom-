import { NextResponse } from "next/server";
import { z } from "zod";
import {
  enforceInternalApiKey,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import { runWhatsAppFollowupCheck } from "@/lib/whatsapp-followup";

const schema = z.object({ eventId: z.string().uuid() }).strict();

export async function POST(request: Request) {
  try {
    enforceInternalApiKey(request);
    const { eventId } = await readValidatedJson(request, schema);
    const result = await runWhatsAppFollowupCheck(eventId);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
