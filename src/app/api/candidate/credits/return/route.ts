import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  orderId: z.string().trim().min(16).max(160),
  cancelled: z.enum(["0", "1"]).optional().default("0"),
  returnTo: z.enum(["mock-interview"]).optional(),
}).strict();

function redirectToCredits(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  const target = new URL("/credits", request.nextUrl.origin);
  if (!parsed.success) {
    target.searchParams.set("paymentReturn", "invalid");
    return NextResponse.redirect(target, 303);
  }
  target.searchParams.set("paymentOrderId", parsed.data.orderId);
  if (parsed.data.cancelled === "1") target.searchParams.set("cancelled", "1");
  if (parsed.data.returnTo) target.searchParams.set("returnTo", parsed.data.returnTo);
  return NextResponse.redirect(target, 303);
}

// Payment providers may return the browser with GET or POST. This route never
// fulfills payment; it only normalizes the browser return to a safe GET page.
// Signed provider webhooks remain the sole authority for credit fulfillment.
export async function GET(request: NextRequest) {
  return redirectToCredits(request);
}

export async function POST(request: NextRequest) {
  return redirectToCredits(request);
}
