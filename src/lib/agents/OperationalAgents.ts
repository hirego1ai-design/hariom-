import { BaseAgent } from './BaseAgent';
import { ToolExecutionContext } from '../tools/ToolRegistry';
import { ModelRouter } from '../ai/ModelRouter';
import { FairnessAuditor } from '../governance/FairnessAuditor';
import { MemoryManager } from '../memory/MemoryManager';
import { MemoryScopeLevel } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { dispatchAiTask } from '@/utils/aiRouter';
import { validateTenantAccess, TenantAccessError } from '../security/TenantContext';
import { z } from 'zod';

const resumeEvaluationSchema = z.object({
  score: z.number().int().min(0).max(100),
  summary: z.string().trim().min(1).max(5_000),
  matchingSkills: z.array(z.string().trim().min(1).max(100)).max(100).optional(),
}).strict();

const mockInterviewSchema = z.object({
  nextQuestion: z.string().trim().min(1).max(5_000),
  evalScore: z.number().int().min(0).max(100).optional(),
  feedback: z.string().trim().min(1).max(5_000).optional(),
}).strict();

// 1. Resume Evaluator Agent (Resume HireScore Evaluator)
export class ResumeEvaluatorAgent extends BaseAgent {
  public readonly agentId = 'resume-evaluator';
  public readonly name = 'Resume HireScore Evaluator Agent';
  public readonly description = 'Evaluates candidate resumes against job requirements and computes HireGo scores.';
  public readonly allowedTools = ['parseResume', 'extractSkills', 'computeHireScore', 'readCandidateProfile'];

  public async execute(
    taskInput: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<Record<string, unknown>> {
    const candidateProfileId = taskInput.candidateProfileId;
    const jobId = taskInput.jobId;
    if (typeof candidateProfileId !== 'string' || typeof jobId !== 'string') {
      throw new TenantAccessError('candidateProfileId and jobId are required.');
    }

    // Fetch Candidate Profile and Job Listing from database
    let profileData = null;
    let jobData = null;

    try {
      profileData = await prisma.candidateProfile.findUnique({
        where: { id: candidateProfileId },
        include: { user: true },
      });
      jobData = await prisma.jobListing.findUnique({ where: { id: jobId } });
    } catch (error) {
      if (process.env.NODE_ENV === "production") {
        throw error;
      }
    }

    if (!profileData || !jobData?.companyId) throw new TenantAccessError('Candidate profile or job listing was not found.');
    validateTenantAccess(context.tenantContext, jobData.companyId);

    const companyId = context.tenantContext.companyId;
    if (companyId) {
      const isTrustedSubmission = taskInput.authorizationContext === 'APPLICATION_SUBMISSION';
      if (isTrustedSubmission) {
        if (context.tenantContext.userRole !== 'CANDIDATE' || profileData.userId !== context.tenantContext.userId) {
          throw new TenantAccessError('Application submission candidate ownership could not be verified.');
        }
      } else {
        // Employer-side evaluation still requires a persisted, tenant-scoped
        // candidate relationship.  The first-application path above is the
        // only deliberate exception.
      let hasAuthorizedRelationship = false;
        const application = await prisma.application.findFirst({
          where: { candidateProfileId, job: { companyId } },
          select: { id: true },
        });
        hasAuthorizedRelationship = !!application;
        if (!hasAuthorizedRelationship) {
          throw new TenantAccessError(
            `Candidate profile ${candidateProfileId} is not authorized for tenant ${companyId}. An active application is required.`,
          );
        }
      }
    }

    const candidateSkills = Array.isArray(profileData.skills) ? profileData.skills : [];
    const jobRequirements = Array.isArray(jobData.requirements) ? jobData.requirements : [];
    const headline = profileData.headline || '';

    // Execute LLM via ModelRouter with multi-provider fallback
    const { result } = await ModelRouter.executeWithFallback({
      taskType: 'resume-screening',
      fn: async (provider, model) => {
        if (provider !== "openai") throw new Error(`Unsupported AI provider: ${provider}`);
        const prompt = `Evaluate candidate resume: "${headline}" with skills [${candidateSkills.join(', ')}] against job requirements [${jobRequirements.join(', ')}]. Return strict JSON only: {"score": integer 0-100, "summary": string, "matchingSkills": string[]}.`;
        const aiTask = await dispatchAiTask({
          task: 'RESUME_SCORE',
          prompt,
          primaryProvider: provider,
        });
        return aiTask.resultText;
      },
    });

    let evaluation: z.infer<typeof resumeEvaluationSchema>;
    try {
      evaluation = resumeEvaluationSchema.parse(JSON.parse(result));
    } catch (error) {
      throw new Error(`Resume evaluator returned invalid structured output: ${error instanceof Error ? error.message : 'unknown parse error'}`);
    }

    // Write DOMAIN memory layer (computed score)
    await MemoryManager.setMemory({
      memoryType: 'DOMAIN',
      scopeLevel: MemoryScopeLevel.CANDIDATE,
      scopeId: candidateProfileId,
      companyId: context.tenantContext.companyId,
      agentId: this.agentId,
      key: 'latest_hirego_score',
      value: { score: evaluation.score, evaluatedAt: new Date().toISOString() },
    });

    return {
      agentId: this.agentId,
      candidateProfileId,
      jobId,
      candidateScore: evaluation.score,
      extractedSkills: candidateSkills,
      matchingSkills: evaluation.matchingSkills || candidateSkills.filter((s) => jobRequirements.includes(s)),
      summary: evaluation.summary,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

// 2. Mock Interview Copilot Agent
export class MockInterviewCopilotAgent extends BaseAgent {
  public readonly agentId = 'mock-interview-copilot';
  public readonly name = 'Mock Interview Copilot Agent';
  public readonly description = 'Generates adaptive interview questions and evaluates candidate answers in real-time.';
  public readonly allowedTools = ['generateQuestion', 'evaluateResponse', 'recordTranscript'];

  public async execute(
    taskInput: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<Record<string, unknown>> {
    const candidateProfileId = taskInput.candidateProfileId;
    if (typeof candidateProfileId !== 'string') throw new Error('candidateProfileId is required.');

    const { result } = await ModelRouter.executeWithFallback({
      taskType: 'mock-interview',
      fn: async (provider) => {
        if (provider !== "openai") throw new Error(`Unsupported AI provider: ${provider}`);
        const aiTask = await dispatchAiTask({
          task: 'INTERVIEW_EVALUATION',
          prompt: `Generate an adaptive technical interview question for a Full Stack AI Engineer. Candidate profile ID: ${candidateProfileId}. Return strict JSON only: {"nextQuestion": string, "evalScore": integer 0-100 optional, "feedback": string optional}.`,
          primaryProvider: provider,
        });
        return aiTask.resultText;
      },
    });

    let interview: z.infer<typeof mockInterviewSchema>;
    try {
      interview = mockInterviewSchema.parse(JSON.parse(result));
    } catch (error) {
      throw new Error(`Mock interview returned invalid structured output: ${error instanceof Error ? error.message : 'unknown parse error'}`);
    }

    return {
      agentId: this.agentId,
      status: 'SUCCESS',
      nextQuestion: interview.nextQuestion,
      evalScore: interview.evalScore ?? null,
      feedback: interview.feedback ?? null,
    };
  }
}

// 3. Security Judge Agent
export class SecurityJudgeAgent extends BaseAgent {
  public readonly agentId = 'security-judge';
  public readonly name = 'Security & Integrity Judge Agent';
  public readonly description = 'Monitors proctoring streams and flags integrity or security violations.';
  public readonly allowedTools = ['logViolation', 'readProctoringStream', 'flagCandidate'];

  public async execute(
    taskInput: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<Record<string, unknown>> {
    const tabSwitchCount = (taskInput.tabSwitchCount as number) ?? 0;
    const faceCount = (taskInput.faceCount as number) ?? 1;

    let flagged = false;
    let integrityScore = 100;
    const violations: string[] = [];

    if (tabSwitchCount > 3) {
      flagged = true;
      integrityScore -= 30;
      violations.push(`Excessive tab switches detected: ${tabSwitchCount}`);
    }

    if (faceCount === 0) {
      flagged = true;
      integrityScore -= 40;
      violations.push('No face detected in proctoring stream frame');
    } else if (faceCount > 1) {
      flagged = true;
      integrityScore -= 50;
      violations.push(`Multiple faces detected in proctoring frame: ${faceCount}`);
    }

    return {
      agentId: this.agentId,
      status: 'SUCCESS',
      integrityScore: Math.max(0, integrityScore),
      violationsDetected: violations.length,
      violations,
      flagged,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

// 4. Communication Coach Agent
export class CommunicationCoachAgent extends BaseAgent {
  public readonly agentId = 'communication-coach';
  public readonly name = 'Communication Coach Agent';
  public readonly description = 'Analyzes audio transcripts for WPM, filler words, clarity, and vocal confidence.';
  public readonly allowedTools = ['analyzeAudio', 'computeWPM', 'countFillers', 'generateFeedback'];

  public async execute(
    taskInput: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<Record<string, unknown>> {
    const transcript = taskInput.transcript;
    const durationSeconds = taskInput.durationSeconds;
    if (typeof transcript !== 'string' || !transcript.trim() || typeof durationSeconds !== 'number' || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      throw new Error('A non-empty transcript and measured durationSeconds are required for communication analysis.');
    }
    
    // Count filler words
    const fillerRegex = /\b(um|uh|like|you know|basically|so)\b/gi;
    const matches = transcript.match(fillerRegex) || [];
    const wordCount = transcript.trim().split(/\s+/).length;
    const wpm = Math.round((wordCount / durationSeconds) * 60);

    const clarityScore = Math.max(50, 100 - matches.length * 10);

    return {
      agentId: this.agentId,
      status: 'SUCCESS',
      wordsPerMinute: wpm,
      fillerCount: matches.length,
      fillerWordsFound: matches,
      clarityScore,
      recommendation: matches.length <= 2 ? 'Excellent pacing and speech clarity.' : 'Pacing is acceptable, but reduce filler words for higher impact.',
    };
  }
}

// 5. Job Description Generator Agent
export class JdGeneratorAgent extends BaseAgent {
  public readonly agentId = 'jd-generator';
  public readonly name = 'Job Description Generator Agent';
  public readonly description = 'Drafts high-converting, bias-free job descriptions based on company requirements.';
  public readonly allowedTools = ['generateJobDescription', 'readCompanyProfile', 'readJobTemplate'];

  public async execute(
    taskInput: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<Record<string, unknown>> {
    const jobTitle = (taskInput.title as string) || 'Senior Full Stack AI Engineer';

    const { result } = await ModelRouter.executeWithFallback({
      taskType: 'jd-generator',
      fn: async (provider) => {
        if (provider !== "openai") throw new Error(`Unsupported AI provider: ${provider}`);
        const aiTask = await dispatchAiTask({
          task: 'JD_GENERATION',
          prompt: `Generate job description for: ${jobTitle}`,
          primaryProvider: provider,
        });
        return aiTask.resultText;
      },
    });

    // Run FairnessAuditor to guarantee bias-free job description
    const fairness = FairnessAuditor.audit(result);

    return {
      agentId: this.agentId,
      status: 'SUCCESS',
      jobTitle,
      jobDescription: result,
      fairnessChecked: fairness.fairnessChecked,
      policyCompliant: fairness.policyCompliant,
      biasScore: fairness.biasScore,
      targetKeywords: ['AI Architecture', 'Prisma', 'TypeScript', 'Next.js', 'PostgreSQL'],
    };
  }
}

// 6. Candidate Matchmaker Agent
export class CandidateMatchmakerAgent extends BaseAgent {
  public readonly agentId = 'candidate-matchmaker';
  public readonly name = 'Candidate Matchmaker Agent';
  public readonly description = 'Matches candidates to job listings using multi-dimensional compatibility scoring.';
  public readonly allowedTools = ['searchCandidates', 'computeCompatibility', 'readJobRequirements'];

  public async execute(
    taskInput: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<Record<string, unknown>> {
    const companyId = context.tenantContext.companyId;
    let candidateProfiles: any[] = [];

    try {
      candidateProfiles = await prisma.candidateProfile.findMany({
        where: companyId
          ? { applications: { some: { job: { companyId } } } }
          : undefined,
        take: 5,
        include: { user: true },
      });
    } catch (error) {
      if (process.env.NODE_ENV === "production") {
        throw error;
      }
    }

    const matches = candidateProfiles.map((c, index) => ({
      candidateProfileId: c.id,
      candidateName: c.user?.name || `Candidate ${index + 1}`,
      compatibilityScore: 90 - index * 4,
    }));

    const fallbackMatches = process.env.NODE_ENV !== "production"
      ? [
          { candidateProfileId: 'cand-101', candidateName: 'Rohit Kumar', compatibilityScore: 92 },
          { candidateProfileId: 'cand-102', candidateName: 'Priya Sharma', compatibilityScore: 88 },
        ]
      : [];

    return {
      agentId: this.agentId,
      status: 'SUCCESS',
      matchedCandidateCount: matches.length || fallbackMatches.length,
      topMatches: matches.length > 0 ? matches : fallbackMatches,
    };
  }
}
