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

function cleanSpokenWords(raw: string): string {
  return raw
    .replace(/^(\*.*?\*|Sara:|Interviewer:)/gi, "")
    .replace(/[\*\_\[\]\#]/g, "")
    .replace(/["""]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

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
    const roleTarget = session.roleTarget || "Candidate";
    const seniority = session.declaredSeniority || "Mid-Level";

    const systemPrompt = `You are ${personaName}, an experienced Executive & Technical Interviewer conducting a live spoken first-round interview call with a candidate for "${roleTarget}" (${seniority}).

CRITICAL LIVE VOICE RULES:
1. You are speaking out loud on a real-time voice call.
2. Respond in 2 spoken sentences maximum. Be concise, sharp, and natural.
3. React directly to what the candidate just answered (give authentic feedback, validate a good point, or follow up with a deeper practical question).
4. If the candidate asked a question or interrupted you, address it immediately.
5. NEVER use markdown, bullet points, asterisks, emojis, quotes, or emotion tags like *nods*. Output ONLY plain spoken words.`;

    let cleanedReply = "";

    // 1. FAST PATH: Groq (responds in ~500ms)
    const groqKey = process.env.GROQ_API_KEY?.trim();
    if (groqKey) {
      try {
        const groqMessages = [
          { role: "system", content: systemPrompt },
          ...body.history.slice(-4).map((h) => ({
            role: h.role,
            content: h.content,
          })),
          { role: "user", content: body.candidateSpeech },
        ];

        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "qwen/qwen3.8-27b",
            messages: groqMessages,
            max_tokens: 100,
            temperature: 0.7,
          }),
          signal: AbortSignal.timeout(4_000),
        });

        if (groqResponse.ok) {
          const json = await groqResponse.json();
          const content = json.choices?.[0]?.message?.content?.trim();
          if (content) {
            cleanedReply = cleanSpokenWords(content);
          }
        }
      } catch (groqErr) {
        console.warn("[LiveTurn] Groq fast-path skipped, using router fallback:", groqErr);
      }
    }

    // 2. FALLBACK PATH: ModelRouter
    if (!cleanedReply) {
      const promptMessages = [
        systemPrompt,
        "",
        "RECENT CONVERSATION:",
        ...body.history.slice(-4).map((h) => `${h.role === "assistant" ? personaName : "Candidate"}: ${h.content}`),
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
            timeoutMs: Math.min(policy.timeoutMs || 8000, 8000),
            temperature: 0.7,
            maxTokens: 100,
            isFallback,
          });
          return execution.resultText;
        },
      });

      cleanedReply = cleanSpokenWords(result);
    }

    if (!cleanedReply) {
      cleanedReply = "That makes sense. Can you walk me through a specific challenge you faced while implementing that?";
    }

    // Record turn in database
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
        feedback: "Live spoken turn recorded.",
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
