import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { handleApiError, enforceRateLimit, readValidatedJson, ApiError } from "@/lib/apiSecurity";
import { executeCode, computeScore } from "@/lib/assessment/CodeExecutionEngine";
import { logAuditEvent } from "@/lib/auditLogger";
import { z } from "zod";

const submitSchema = z.object({
  problemId: z.string().uuid(),
  language: z.enum(["python3", "javascript", "typescript", "java", "cpp", "go"]),
  code: z.string().min(1).max(50_000),
}).strict();

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") {
      throw new ApiError("Forbidden: Only candidates can submit code", 403);
    }

    await enforceRateLimit(request, "assessment_coding_submit");

    const body = await readValidatedJson(request, submitSchema);
    
    const problem = await prisma.codingProblem.findUnique({
      where: { id: body.problemId },
      include: {
        testCases: true
      }
    });

    if (!problem) {
      throw new ApiError("Problem not found", 404);
    }

    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: session.id }
    });

    if (!candidateProfile) {
      throw new ApiError("Candidate profile not found", 404);
    }

    const executionResult = await executeCode(
      body.code, 
      body.language, 
      problem.testCases, 
      problem.timeLimitMs || 2000,
      problem.memoryLimitMb || 128,
    );
    
    const score = computeScore(executionResult.passedTests, executionResult.totalTests);

    const submission = await prisma.codingSubmission.create({
      data: {
        candidateProfileId: candidateProfile.id,
        problemId: problem.id,
        code: body.code,
        language: body.language,
        status: executionResult.status,
        score: score,
        passedTests: executionResult.passedTests,
        totalTests: executionResult.totalTests,
        runtimeMs: executionResult.runtimeMs,
      }
    });

    // Update highest score if this is better
    if (score > (candidateProfile.hireGoScore || 0)) {
      await prisma.candidateProfile.update({
        where: { id: candidateProfile.id },
        data: { hireGoScore: score }
      });
    }

    await logAuditEvent({
      action: 'CODING_ASSESSMENT_SUBMITTED',
      userId: session.id,
      resource: `coding_problem_${problem.id}`,
      details: `Submitted problem ${problem.id} with status ${executionResult.status} and score ${score}`
    });

    // Filter results to only show public test case details
    const publicResultsOnly = executionResult.results.filter((res, index) => {
      const tc = problem.testCases[index];
      return !tc.isHidden;
    });

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        status: submission.status,
        score: submission.score,
        passedTests: submission.passedTests,
        totalTests: submission.totalTests,
        runtimeMs: submission.runtimeMs,
        results: publicResultsOnly
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
