import {
  Prisma,
  SkillEvidenceType,
  SkillProficiencyLevel,
  SkillVerificationStatus,
} from "@prisma/client";
import { MIN_QUESTIONS_PER_SKILL } from "@/lib/knowledgeScreeningPolicy";

export const MIN_SKILL_QUESTIONS_FOR_VALIDATION = MIN_QUESTIONS_PER_SKILL;
export const DEFAULT_SKILL_VALIDITY_DAYS = 180;

export type ClaimedSkillInput = {
  name: string;
  claimedLevel: "beginner" | "intermediate" | "advanced" | "expert";
};

export type McqQuestionResult = {
  skillTags?: string[];
  category?: string | null;
  points: number;
  correct: boolean;
};

export type AggregatedSkillEvidence = {
  name: string;
  normalizedName: string;
  questionCount: number;
  earnedPoints: number;
  totalPoints: number;
  score: number;
};

export function normalizeSkillName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function canonicalDisplayName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function toSkillProficiencyLevel(level: ClaimedSkillInput["claimedLevel"]): SkillProficiencyLevel {
  switch (level) {
    case "beginner": return SkillProficiencyLevel.BEGINNER;
    case "advanced": return SkillProficiencyLevel.ADVANCED;
    case "expert": return SkillProficiencyLevel.EXPERT;
    default: return SkillProficiencyLevel.INTERMEDIATE;
  }
}

export function aggregateMcqSkillEvidence(results: McqQuestionResult[]): AggregatedSkillEvidence[] {
  const totals = new Map<string, Omit<AggregatedSkillEvidence, "score">>();

  for (const result of results) {
    const rawTags = result.skillTags?.length
      ? result.skillTags
      : result.category?.trim()
        ? [result.category]
        : [];

    const uniqueTags = new Map<string, string>();
    for (const rawTag of rawTags) {
      const displayName = canonicalDisplayName(rawTag);
      const normalizedName = normalizeSkillName(displayName);
      if (normalizedName) uniqueTags.set(normalizedName, displayName);
    }

    for (const [normalizedName, name] of uniqueTags) {
      const current = totals.get(normalizedName) ?? {
        name,
        normalizedName,
        questionCount: 0,
        earnedPoints: 0,
        totalPoints: 0,
      };
      current.questionCount += 1;
      current.totalPoints += Math.max(0, result.points);
      if (result.correct) current.earnedPoints += Math.max(0, result.points);
      totals.set(normalizedName, current);
    }
  }

  return Array.from(totals.values())
    .map((item) => ({
      ...item,
      score: item.totalPoints > 0 ? Math.round((item.earnedPoints / item.totalPoints) * 100) : 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function qualifiesMcqSkillEvidence(
  evidence: AggregatedSkillEvidence,
  passingPercentage: number,
) {
  return evidence.questionCount >= MIN_SKILL_QUESTIONS_FOR_VALIDATION
    && evidence.totalPoints > 0
    && evidence.score >= passingPercentage;
}

async function findSkillMasterIds(
  tx: Prisma.TransactionClient,
  names: string[],
) {
  if (!names.length) return new Map<string, string>();
  const masters = await tx.skillMaster.findMany({
    where: {
      isActive: true,
      OR: names.map((name) => ({ name: { equals: name, mode: "insensitive" as const } })),
    },
    select: { id: true, name: true },
  });
  return new Map(masters.map((item) => [normalizeSkillName(item.name), item.id]));
}

export async function syncCandidateClaimedSkills(
  tx: Prisma.TransactionClient,
  candidateProfileId: string,
  skills: ClaimedSkillInput[],
) {
  const deduped = new Map<string, ClaimedSkillInput>();
  for (const skill of skills) {
    const name = canonicalDisplayName(skill.name);
    const normalizedName = normalizeSkillName(name);
    if (!normalizedName) continue;
    deduped.set(normalizedName, { name, claimedLevel: skill.claimedLevel });
  }

  const entries = Array.from(deduped.entries());
  const masterIds = await findSkillMasterIds(tx, entries.map(([, skill]) => skill.name));

  for (const [normalizedName, skill] of entries) {
    await tx.candidateSkill.upsert({
      where: {
        candidateProfileId_normalizedName: {
          candidateProfileId,
          normalizedName,
        },
      },
      create: {
        candidateProfileId,
        skillId: masterIds.get(normalizedName) ?? null,
        name: skill.name,
        normalizedName,
        claimedLevel: toSkillProficiencyLevel(skill.claimedLevel),
        isVisible: true,
      },
      update: {
        skillId: masterIds.get(normalizedName) ?? undefined,
        name: skill.name,
        claimedLevel: toSkillProficiencyLevel(skill.claimedLevel),
        isVisible: true,
      },
    });
  }

  await tx.candidateSkill.updateMany({
    where: {
      candidateProfileId,
      ...(entries.length
        ? { normalizedName: { notIn: entries.map(([normalizedName]) => normalizedName) } }
        : {}),
    },
    data: { isVisible: false },
  });
}

async function recomputeCandidateSkillVerification(
  tx: Prisma.TransactionClient,
  candidateSkillId: string,
  now: Date,
) {
  const qualifyingEvidence = await tx.skillEvidence.findMany({
    where: { candidateSkillId, qualifiesVerification: true },
    orderBy: { observedAt: "desc" },
  });

  const active = qualifyingEvidence.filter((item) => !item.validUntil || item.validUntil > now);
  if (active.length === 0) {
    await tx.candidateSkill.update({
      where: { id: candidateSkillId },
      data: {
        verificationStatus: qualifyingEvidence.length
          ? SkillVerificationStatus.EXPIRED
          : SkillVerificationStatus.SELF_DECLARED,
        latestScore: null,
        verifiedAt: null,
        validUntil: null,
        verifiedLevel: null,
      },
    });
    return;
  }

  const evidenceTypes = new Set(active.map((item) => item.evidenceType));
  const expiries = active.map((item) => item.validUntil).filter((value): value is Date => !!value);
  const validUntil = expiries.length
    ? new Date(Math.min(...expiries.map((value) => value.getTime())))
    : null;

  await tx.candidateSkill.update({
    where: { id: candidateSkillId },
    data: {
      verificationStatus: evidenceTypes.size >= 2
        ? SkillVerificationStatus.VERIFIED
        : SkillVerificationStatus.ASSESSMENT_VALIDATED,
      latestScore: active[0].score,
      verifiedAt: active[0].observedAt,
      validUntil,
    },
  });
}

export async function persistMcqSkillEvidence(
  tx: Prisma.TransactionClient,
  input: {
    candidateProfileId: string;
    assessmentId: string;
    attemptId: string;
    roleTitle?: string | null;
    seniority?: string | null;
    passingPercentage: number;
    validityDays?: number | null;
    questionResults: McqQuestionResult[];
  },
) {
  const evidence = aggregateMcqSkillEvidence(input.questionResults);
  if (!evidence.length) return evidence;

  const now = new Date();
  const validityDays = input.validityDays && input.validityDays > 0
    ? input.validityDays
    : DEFAULT_SKILL_VALIDITY_DAYS;
  const validUntil = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);
  const masterIds = await findSkillMasterIds(tx, evidence.map((item) => item.name));

  for (const item of evidence) {
    const candidateSkill = await tx.candidateSkill.upsert({
      where: {
        candidateProfileId_normalizedName: {
          candidateProfileId: input.candidateProfileId,
          normalizedName: item.normalizedName,
        },
      },
      create: {
        candidateProfileId: input.candidateProfileId,
        skillId: masterIds.get(item.normalizedName) ?? null,
        name: item.name,
        normalizedName: item.normalizedName,
        claimedLevel: SkillProficiencyLevel.INTERMEDIATE,
        isVisible: true,
      },
      update: {
        skillId: masterIds.get(item.normalizedName) ?? undefined,
        name: item.name,
        isVisible: true,
      },
    });

    await tx.skillEvidence.upsert({
      where: {
        candidateSkillId_evidenceType_sourceId: {
          candidateSkillId: candidateSkill.id,
          evidenceType: SkillEvidenceType.MCQ_ASSESSMENT,
          sourceId: input.attemptId,
        },
      },
      create: {
        candidateSkillId: candidateSkill.id,
        evidenceType: SkillEvidenceType.MCQ_ASSESSMENT,
        sourceId: input.attemptId,
        sourceVersion: input.assessmentId,
        score: item.score,
        earnedPoints: item.earnedPoints,
        totalPoints: item.totalPoints,
        questionCount: item.questionCount,
        roleTitle: input.roleTitle ?? null,
        seniority: input.seniority ?? null,
        qualifiesVerification: qualifiesMcqSkillEvidence(item, input.passingPercentage),
        observedAt: now,
        validUntil,
      },
      update: {
        score: item.score,
        earnedPoints: item.earnedPoints,
        totalPoints: item.totalPoints,
        questionCount: item.questionCount,
        qualifiesVerification: qualifiesMcqSkillEvidence(item, input.passingPercentage),
        observedAt: now,
        validUntil,
      },
    });

    await recomputeCandidateSkillVerification(tx, candidateSkill.id, now);
  }

  return evidence;
}
