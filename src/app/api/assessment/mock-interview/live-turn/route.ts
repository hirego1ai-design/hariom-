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

    const systemPrompt = `You are Sara, a Senior Executive Technical Interviewer with 10+ years of hiring experience at top technology companies (Google, Amazon, Microsoft, and high-growth scale-ups).

You are conducting a live spoken first-round technical and behavioural interview for "${roleTarget}" at the ${seniority} level.

YOUR CHARACTER & METHODOLOGY:
- Sharp, warm, perceptive, and conversational — like an elite interviewer conducting a real phone screening.
- You evaluate real-world engineering and domain substance, not buzzwords or rehearsed textbook definitions.
- You actively drive the mock interview: acknowledge what the candidate just said in a few words, then immediately ask a focused, high-yield follow-up or next interview question.
- Across turns, probe key competencies: architecture & system trade-offs, debugging edge cases, scale & performance, error handling, and team collaboration.
- If their answer was strong: validate briefly, then raise the stakes ("How would that hold up if traffic spiked 10x?", "What was the single biggest failure mode you hit?").
- If their answer was vague or struggling: give a gentle nudge or guide them to a concrete example from their recent work.
- If the candidate asked a question or interrupted: address it naturally in 1 sentence, then smoothly guide back to the topic.

CRITICAL LIVE VOICE RULES:
1. You are speaking out loud on a real-time voice call. Not typing.
2. Maximum 2 spoken sentences (under 35 words total). Crisp, punchy, natural spoken English.
3. Sentence 1: Acknowledge or react to their previous point authentically (never repeat "Great point" or "Good question").
4. Sentence 2: Ask the next clear, role-specific interview question.
5. NEVER use markdown, bullet points, asterisks, emojis, quotes, or action tags like *nods*. Output ONLY plain spoken words.
6. AMBIENT NOISE & SIDE-TALK FILTER: The candidate may be in a shared space with roommates, passing talk, or background noise. If you detect ambient side-conversations or off-topic room chatter in their speech, ignore the background talk completely and evaluate only the candidate's technical response.`;

    let cleanedReply = "";

    // 1. FAST PATH A: Groq (ultra-low latency ~500ms - 1.2s)
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

        // Try qwen/qwen3.8-27b or openai/gpt-oss-20b on Groq
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "qwen/qwen3.8-27b",
            messages: groqMessages,
            max_tokens: 150,
            temperature: 0.7,
          }),
          signal: AbortSignal.timeout(3_500),
        });

        if (groqResponse.ok) {
          const json = await groqResponse.json();
          const content = json.choices?.[0]?.message?.content?.trim();
          if (content) {
            cleanedReply = cleanSpokenWords(content);
          }
        }
      } catch (groqErr) {
        console.warn("[LiveTurn] Groq fast-path skipped, using OpenRouter fast-fallback:", groqErr);
      }
    }

    // 2. FAST PATH B: OpenRouter fast-fallback (~1.2s)
    if (!cleanedReply) {
      const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
      if (openRouterKey) {
        try {
          const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "nvidia/nemotron-3-ultra-550b-a55b:free",
              messages: [
                { role: "system", content: systemPrompt },
                ...body.history.slice(-4).map((h) => ({
                  role: h.role,
                  content: h.content,
                })),
                { role: "user", content: body.candidateSpeech },
              ],
              max_tokens: 150,
              temperature: 0.7,
            }),
            signal: AbortSignal.timeout(4_000),
          });

          if (orResponse.ok) {
            const orJson = await orResponse.json();
            const orContent = orJson.choices?.[0]?.message?.content?.trim();
            if (orContent) {
              cleanedReply = cleanSpokenWords(orContent);
            }
          }
        } catch (orErr) {
          console.warn("[LiveTurn] OpenRouter fast-fallback skipped:", orErr);
        }
      }
    }

    // 3. FALLBACK PATH: ModelRouter
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
      cleanedReply = `That is a solid point. In your work as a ${roleTarget}, walk me through the most critical engineering trade-off you had to make.`;
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
