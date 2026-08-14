import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = getCurrentSession(request.headers);

  if (!session) {
    return NextResponse.json(
      { success: false, authenticated: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    user: session,
  });
}
