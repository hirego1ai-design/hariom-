import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { handleApiError, enforceRateLimit, readValidatedJson, ApiError } from "@/lib/apiSecurity";
import { executeCode } from "@/lib/assessment/CodeExecutionEngine";
import { z } from "zod";

const runSchema = z.object({
  problemId: z.string().uuid(),
  language: z.enum(["python3", "javascript", "typescript", "java", "cpp", "go"]),
  code: z.string().min(1).max(50_000),
}).strict();

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") {
      throw new ApiError("Forbidden: Only candidates can run code", 403);
    }

    await enforceRateLimit(request, "assessment_coding_run");

    const body = await readValidatedJson(request, runSchema);
    
    const problem = await prisma.codingProblem.findUnique({
      where: { id: body.problemId },
      include: {
        testCases: {
          where: { isHidden: false }
        }
      }
    });

    if (!problem) {
      throw new ApiError("Problem not found", 404);
    }

    const result = await executeCode(
      body.code,
      body.language,
      problem.testCases,
      problem.timeLimitMs || 2000,
      problem.memoryLimitMb || 128,
    );

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    return handleApiError(error);
  }
}
