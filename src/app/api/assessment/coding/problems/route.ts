import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiSecurity";

export async function GET(request: Request) {
  try {
    const problems = await prisma.codingProblem.findMany({
      where: { isActive: true },
      include: {
        testCases: {
          where: { isHidden: false },
        },
      },
    });

    return NextResponse.json({
      success: true,
      problems,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
