import { NextResponse } from "next/server";
import { enforceInternalApiKey, handleApiError } from "@/lib/apiSecurity";
import { processSecurityAuditDeliveryBatch } from "@/lib/securityAuditDelivery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    enforceInternalApiKey(request);
    const report = await processSecurityAuditDeliveryBatch(20, { requireConfiguration: true });

    return NextResponse.json(
      { success: true, ...report },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
