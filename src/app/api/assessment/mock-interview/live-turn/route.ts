import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import {
  ApiError,
  enforceRateLimit,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { ModelRouter } from "@/lib/ai/ModelRouter";
import { dispatchAiTask } from "@/utils/aiRouter";

const requestSchema = z.object({
  sessionId: z.string().uuid(),
  candidateSpeech: z.string().min(1).max(3000),
  history: z.array(
    z.object({
      role: z.enum(["assistant", "user"]),
      content: z.string().max(2000),
    }),
  ).max(30),
}).strict();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentSession(request.headers);
    if (!auth || auth.role !== "CANDIDATE") {
      throw new ApiError("Unauthorized", 401);
    }

    await enforceRateLimit(
      request,
      `mock_interview_live_turn:${auth.id}`,
      90,
      60_000,
    );

    const body = await readValidatedJson(request, requestSchema, 32 * 1024);

    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: auth.id },
      select: { id: true },
    });

    const session = await prisma.mockInterviewSession.findUnique({
      where: { id: body.sessionId },
      include: {
        persona: true,
        turns: {
          orderBy: { questionIndex: "asc" },
        },
      },
    });

    if (
      !candidateProfile ||
      !session ||
      session.candidateProfileId !== candidateProfile.id
    ) {
      throw new ApiError("Session not found.", 404);
    }

    if (session.status !== "IN_PROGRESS") {
      throw new ApiError("Interview is not currently in progress.", 409);
    }

    const personaName = session.persona?.displayName || "Sara";
    const roleTarget = session.roleTarget || "Software Engineer";
    const seniority = session.declaredSeniority || "Mid-Level";

    const promptMessages = [
      `You are ${personaName}, an elite Senior Executive and Technical/Behavioral Interviewer conducting a LIVE voice interview call with a candidate for the role of "${roleTarget}" (${seniority}).`,
      "",
      "CRITICAL VOICE CONVERSATION RULES:",
      "1. You are talking out loud on a real-time call (like Gemini Live or a live Zoom call).",
      "2. Respond naturally in 2 to 3 spoken sentences maximum. Never speak in long monologues or paragraphs.",
      "3. Acknowledge what the candidate just said with genuine human reaction, then follow up with a pointed question, scenario, or deeper technical inquiry.",
      "4. If the candidate interrupted you, asked a question, or clarified something, answer them directly before steering the conversation forward.",
      "5. NEVER use markdown, bullet points, asterisks, emoji, quotes around speech, or stage directions like *smiles* or *nods*. Output ONLY plain text sentences that can be spoken directly by text-to-speech.",
      "",
      "RECENT CONVERSATION HISTORY:",
      ...body.history.slice(-6).map((h) => `${h.role === "assistant" ? personaName : "Candidate"}: ${h.content}`),
      `Candidate: ${body.candidateSpeech}`,
      `${personaName}:`,
    ].join("\n");

    const { result } = await ModelRouter.executeWithFallback({
      taskType: "mock-interview",
      fn: async (endpoint, policy, isFallback) => {
        const execution = await dispatchAiTask({
          task: "INTERVIEW_EVALUATION",
          taskType: "mock-interview",
          prompt: promptMessages,
          provider: endpoint.provider,
          model: endpoint.model,
          modelConfig: endpoint.config,
          timeoutMs: Math.min(policy.timeoutMs || 10000, 10000),
          temperature: 0.7,
          maxTokens: 150,
          isFallback,
        });
        return execution.resultText;
      },
    });

    let cleanedReply = result.trim()
      .replace(/^(\*.*?\*|Sara:|Interviewer:)/gi, "")
      .replace(/[\*\_\[\]\#]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanedReply) {
      cleanedReply = "I see your point. Could you elaborate a bit more on how you handled that?";
    }

    // Save this turn interaction to the database
    const nextQuestionIndex = (session.turns.length > 0
      ? Math.max(...session.turns.map((t) => t.questionIndex)) + 1
      : 1);

    await prisma.mockInterviewTurn.create({
      data: {
        sessionId: session.id,
        questionIndex: nextQuestionIndex,
        questionText: cleanedReply,
        candidateAnswerTranscript: body.candidateSpeech,
        score: 75,
        feedback: "Live conversation turn recorded.",
      },
    });

    await prisma.mockInterviewSession.update({
      where: { id: session.id },
      data: {
        currentQuestionIndex: nextQuestionIndex,
        totalQuestions: Math.max(session.totalQuestions, nextQuestionIndex + 1),
      },
    });

    return NextResponse.json({
      success: true,
      replyText: cleanedReply,
      turnIndex: nextQuestionIndex,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
