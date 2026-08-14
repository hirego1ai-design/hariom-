import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { PaymentGatewayController } from "@/lib/payments/PaymentGatewayController";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized: Admin role required." }, { status: 401 });
    }

    const config = await PaymentGatewayController.getConfig();
    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized: Admin role required." }, { status: 401 });
    }

    const body = await req.json();
    const updatedConfig = await PaymentGatewayController.updateConfig(body);

    return NextResponse.json({
      success: true,
      message: "Payment gateway configuration updated successfully.",
      config: updatedConfig,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
