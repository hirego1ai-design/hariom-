import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { handleApiError } from "@/lib/apiSecurity";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentSession(request.headers);
    const id = params.id;
    
    // Determine if user can see hidden test cases
    const canSeeHidden = session?.role === "ADMIN";

    const problem = await prisma.codingProblem.findFirst({
      where: {
        OR: [
          { id: id },
          { slug: id }
        ]
      },
      include: {
        testCases: canSeeHidden ? true : {
          where: { isHidden: false }
        }
      }
    });

    if (!problem) {
      return NextResponse.json(
        { success: false, error: "Problem not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      problem
    });
  } catch (error) {
    return handleApiError(error);
  }
}
