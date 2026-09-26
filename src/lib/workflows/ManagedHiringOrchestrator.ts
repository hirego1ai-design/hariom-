import { prisma } from "@/lib/prisma";
import {
  computeMatchScore,
  evaluateCandidateScreening,
} from "@/lib/matching/JobMatchingEngine";

export type ManagedHiringNextAction =
  | "WAIT_FOR_REQUIRED_ASSESSMENT"
  | "ASSESSMENT_RECOMMENDED"
  | "HUMAN_REVIEW_REQUIRED"
  | "SHORTLIST_RECOMMENDED"
  | "WAIT_FOR_INTERVIEW_CONFIGURATION"
  | "WAIT_FOR_INTERVIEW"
  | "WAIT_FOR_FEEDBACK"
  | "WAIT_FOR_HUMAN_DECISION"
  | "WAIT_FOR_OFFER"
  | "WAIT_FOR_CANDIDATE_OFFER_RESPONSE"
  | "WAIT_FOR_JOINING_CONFIRMATION"
  | "COMPLETED"
  | "STOPPED";

export interface ManagedHiringOrchestrationState {
  applicationId: string;
  applicationStatus: string;
  nextAction: ManagedHiringNextAction;
  automaticRejectionAllowed: false;
  humanDecisionRequired: boolean;
  reason: string;
  screening?: ReturnType<typeof evaluateCandidateScreening>;
  matchScore?: number;
}

const TERMINAL = new Set(["REJECTED", "WITHDRAWN"]);

export async function resolveManagedHiringNextAction(
  applicationId: string,
): Promise<ManagedHiringOrchestrationState> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        include: {
          interviewProcess: {
            include: {
              rounds: { orderBy: { sequence: "asc" } },
            },
          },
        },
      },
      candidateProfile: {
        include: { candidateSkills: true },
      },
      gates: true,
      roundProgress: {
        include: { round: true, interview: true },
      },
      offers: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!application) throw new Error("Application not found.");

  const base = {
    applicationId: application.id,
    applicationStatus: application.status,
    automaticRejectionAllowed: false as const,
  };

  if (TERMINAL.has(application.status)) {
    return {
      ...base,
      nextAction: "STOPPED",
      humanDecisionRequired: false,
      reason: `Application is in terminal status ${application.status}.`,
    };
  }

  if (application.status === "HIRED") {
    return {
      ...base,
      nextAction: "COMPLETED",
      humanDecisionRequired: false,
      reason: "Candidate joining has been confirmed.",
    };
  }

  const pendingGate = application.gates.find((gate) =>
    ["REQUIRED", "IN_PROGRESS"].includes(gate.status),
  );
  if (pendingGate) {
    return {
      ...base,
      nextAction: "WAIT_FOR_REQUIRED_ASSESSMENT",
      humanDecisionRequired: false,
      reason:
        "A required candidate assessment/evidence gate is still open. Missing evidence cannot trigger rejection.",
    };
  }

  const match = computeMatchScore(application.candidateProfile, application.job);
  const screening = evaluateCandidateScreening(match);
  const screenedBase = {
    ...base,
    screening,
    matchScore: match.matchScore,
  };

  if (
    !["SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "SELECTED", "OFFERED"].includes(application.status) &&
    screening.disposition === "ASSESSMENT_RECOMMENDED"
  ) {
    return {
      ...screenedBase,
      nextAction: "ASSESSMENT_RECOMMENDED",
      humanDecisionRequired: false,
      reason:
        "Candidate evidence is incomplete or self-declared. Route to validation instead of rejecting.",
    };
  }

  if (
    !["SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "SELECTED", "OFFERED"].includes(application.status) &&
    screening.disposition === "HUMAN_REVIEW_REQUIRED"
  ) {
    return {
      ...screenedBase,
      nextAction: "HUMAN_REVIEW_REQUIRED",
      humanDecisionRequired: true,
      reason:
        "Evidence is ambiguous or job requirements are insufficient for an automated recommendation.",
    };
  }

  if (
    !["SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "SELECTED", "OFFERED"].includes(application.status) &&
    screening.disposition === "SHORTLIST_RECOMMENDED"
  ) {
    return {
      ...screenedBase,
      nextAction: "SHORTLIST_RECOMMENDED",
      humanDecisionRequired: true,
      reason:
        "Evidence supports shortlisting. The system recommends rather than making the consequential hiring decision.",
    };
  }

  const process = application.job.interviewProcess;
  if (!process?.isActive || process.rounds.length === 0) {
    return {
      ...screenedBase,
      nextAction: "WAIT_FOR_INTERVIEW_CONFIGURATION",
      humanDecisionRequired: true,
      reason:
        "No active persisted interview plan is configured for this job.",
    };
  }

  const progressByRound = new Map(
    application.roundProgress.map((progress) => [progress.roundId, progress]),
  );
  for (const round of process.rounds) {
    const progress = progressByRound.get(round.id);
    if (!progress || ["PENDING", "SCHEDULED"].includes(progress.status)) {
      return {
        ...screenedBase,
        nextAction: "WAIT_FOR_INTERVIEW",
        humanDecisionRequired: false,
        reason: `Interview round ${round.sequence} (${round.name}) has not been completed.`,
      };
    }
    if (["LIVE", "ENDED_PENDING_FEEDBACK", "ROUND_COMPLETE"].includes(progress.status)) {
      return {
        ...screenedBase,
        nextAction:
          progress.status === "ROUND_COMPLETE"
            ? "WAIT_FOR_HUMAN_DECISION"
            : "WAIT_FOR_FEEDBACK",
        humanDecisionRequired: progress.status === "ROUND_COMPLETE",
        reason:
          progress.status === "ROUND_COMPLETE"
            ? `Round ${round.sequence} is complete and requires the controlled human proceed/hold/reject decision.`
            : `Round ${round.sequence} is awaiting completion or required panel feedback.`,
      };
    }
    if (progress.status === "ON_HOLD") {
      return {
        ...screenedBase,
        nextAction: "WAIT_FOR_HUMAN_DECISION",
        humanDecisionRequired: true,
        reason: `Round ${round.sequence} is on hold pending a human decision.`,
      };
    }
  }

  const latestOffer = application.offers[0];
  if (!latestOffer) {
    return {
      ...screenedBase,
      nextAction: "WAIT_FOR_OFFER",
      humanDecisionRequired: true,
      reason:
        "All configured interview rounds are complete. Offer creation remains a controlled employer action.",
    };
  }

  if (["DRAFT", "SENT"].includes(latestOffer.status)) {
    return {
      ...screenedBase,
      nextAction: "WAIT_FOR_CANDIDATE_OFFER_RESPONSE",
      humanDecisionRequired: false,
      reason: "A persisted offer is awaiting the candidate response.",
    };
  }

  if (latestOffer.status === "ACCEPTED") {
    return {
      ...screenedBase,
      nextAction: "WAIT_FOR_JOINING_CONFIRMATION",
      humanDecisionRequired: true,
      reason:
        "The candidate accepted the persisted offer. Actual joining must be confirmed before PPH billing can proceed.",
    };
  }

  return {
    ...screenedBase,
    nextAction: "WAIT_FOR_HUMAN_DECISION",
    humanDecisionRequired: true,
    reason: `Latest offer status is ${latestOffer.status}; reconcile before continuing.`,
  };
}
