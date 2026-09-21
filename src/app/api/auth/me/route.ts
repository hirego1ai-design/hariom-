import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { handleApiError } from "@/lib/apiSecurity";

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession(request.headers);

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
  } catch (error) {
    return handleApiError(error);
  }
}
