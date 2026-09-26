import { prisma } from "@/lib/prisma";
import {
  evaluateEvidenceFirstScreening,
  type EvidenceFirstScreeningInput,
} from "@/lib/matching/EvidenceFirstScreening";

export interface MatchingConfig {
  weightExperience: number;
  weightEducation: number;
  weightSkills: number;
  autoArchiveScore: number;
  autoInterviewLimit: number;
}

export type SkillRequirementPriority = "required" | "preferred";

export interface ParsedSkillRequirement {
  name: string;
  normalizedName: string;
  priority: SkillRequirementPriority;
}

const DEFAULT_CONFIG: MatchingConfig = {
  weightExperience: 40,
  weightEducation: 20,
  weightSkills: 40,
  // Retained for backwards-compatible job configuration only. This engine
  // never uses a score threshold to auto-reject/archive a candidate.
  autoArchiveScore: 70,
  autoInterviewLimit: 10,
};

export function normalizeSkillName(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function parsePriority(value: unknown): SkillRequirementPriority {
  return value === "preferred" ? "preferred" : "required";
}

export function parseJobSkillRequirements(job: any): ParsedSkillRequirement[] {
  const structured = Array.isArray(job?.skillRequirements)
    ? job.skillRequirements
    : [];

  const parsedStructured = structured
    .map((item: unknown): ParsedSkillRequirement | null => {
      if (typeof item === "string") {
        const name = item.trim();
        const normalizedName = normalizeSkillName(name);
        return name && normalizedName
          ? { name, normalizedName, priority: "required" }
          : null;
      }
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const record = item as Record<string, unknown>;
      if (typeof record.name !== "string") return null;
      const name = record.name.trim();
      const normalizedName = normalizeSkillName(name);
      if (!name || !normalizedName) return null;
      return {
        name,
        normalizedName,
        priority: parsePriority(record.priority),
      };
    })
    .filter((item: ParsedSkillRequirement | null): item is ParsedSkillRequirement => item !== null);

  const source = parsedStructured.length > 0
    ? parsedStructured
    : (Array.isArray(job?.requirements) ? job.requirements : [])
      .filter((item: unknown): item is string => typeof item === "string")
      .map((name: string): ParsedSkillRequirement | null => {
        const trimmed = name.trim();
        const normalizedName = normalizeSkillName(trimmed);
        return trimmed && normalizedName
          ? { name: trimmed, normalizedName, priority: "required" }
          : null;
      })
      .filter((item: ParsedSkillRequirement | null): item is ParsedSkillRequirement => item !== null);

  const deduped = new Map<string, ParsedSkillRequirement>();
  for (const requirement of source) {
    const current = deduped.get(requirement.normalizedName);
    // A required requirement always wins over a preferred duplicate.
    if (!current || requirement.priority === "required") {
      deduped.set(requirement.normalizedName, requirement);
    }
  }
  return [...deduped.values()];
}

function parseRequiredExperienceYears(job: any): number {
  const text = [
    typeof job?.description === "string" ? job.description : "",
    ...(Array.isArray(job?.requirements)
      ? job.requirements.filter((item: unknown): item is string => typeof item === "string")
      : []),
  ].join(" ");

  const patterns = [
    /(?:minimum|min\.?|at least)\s*(\d+(?:\.\d+)?)\s*(?:\+\s*)?(?:years?|yrs?)/i,
    /(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience/i,
    /(\d+(?:\.\d+)?)\s*(?:-|to)\s*\d+(?:\.\d+)?\s*(?:years?|yrs?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && parsed >= 0) return parsed;
    }
  }
  return 0;
}

function candidateExperienceEvidence(candidate: any): {
  years: number | null;
  available: boolean;
} {
  const rawYears = candidate?.experienceYears;
  const years =
    typeof rawYears === "number" && Number.isFinite(rawYears) && rawYears >= 0
      ? rawYears
      : null;

  const structuredExperience = candidate?.experience;
  const hasStructuredExperience =
    Array.isArray(structuredExperience)
      ? structuredExperience.length > 0
      : Boolean(
          structuredExperience &&
          typeof structuredExperience === "object" &&
          Object.keys(structuredExperience as Record<string, unknown>).length > 0,
        );

  // CandidateProfile.experienceYears currently defaults to zero, so a bare
  // zero without any structured experience cannot safely be interpreted as
  // proof of "zero experience".
  const available = (years !== null && years > 0) || hasStructuredExperience;
  return { years: available ? years ?? 0 : null, available };
}

function candidateSkillEvidence(candidate: any) {
  const records = Array.isArray(candidate?.candidateSkills)
    ? candidate.candidateSkills
    : [];
  const legacySkills = Array.isArray(candidate?.skills)
    ? candidate.skills.filter((item: unknown): item is string => typeof item === "string")
    : [];

  const visibleRecords = records.filter((skill: any) => skill?.isVisible !== false);
  const names = [
    ...visibleRecords
      .map((skill: any) =>
        typeof skill?.normalizedName === "string" && skill.normalizedName.trim()
          ? skill.normalizedName
          : skill?.name,
      )
      .filter((name: unknown): name is string => typeof name === "string"),
    ...legacySkills,
  ];

  const all = new Set(
    names.map(normalizeSkillName).filter((name: string) => Boolean(name)),
  );
  const now = Date.now();
  const verified = new Set(
    visibleRecords
      .filter(
        (skill: any) =>
          ["ASSESSMENT_VALIDATED", "VERIFIED"].includes(skill?.verificationStatus) &&
          (!skill?.validUntil || new Date(skill.validUntil).getTime() > now),
      )
      .map((skill: any) =>
        normalizeSkillName(
          typeof skill?.normalizedName === "string" && skill.normalizedName.trim()
            ? skill.normalizedName
            : skill?.name,
        ),
      )
      .filter((name: string) => Boolean(name)),
  );

  return { all, verified, available: all.size > 0 };
}

export function computeMatchScore(candidate: any, job: any) {
  const requestedConfig =
    job?.matchingConfig && typeof job.matchingConfig === "object"
      ? job.matchingConfig
      : {};
  const config = {
    ...DEFAULT_CONFIG,
    ...Object.fromEntries(
      Object.entries(requestedConfig).filter(
        ([, value]) => typeof value === "number" && Number.isFinite(value),
      ),
    ),
  };

  const requirements = parseJobSkillRequirements(job);
  const requiredRequirements = requirements.filter(
    (requirement) => requirement.priority === "required",
  );
  const preferredRequirements = requirements.filter(
    (requirement) => requirement.priority === "preferred",
  );

  const skills = candidateSkillEvidence(candidate);
  const matchingRequired = requiredRequirements.filter((requirement) =>
    skills.all.has(requirement.normalizedName),
  );
  const matchingPreferred = preferredRequirements.filter((requirement) =>
    skills.all.has(requirement.normalizedName),
  );
  const verifiedMatchingRequired = matchingRequired.filter((requirement) =>
    skills.verified.has(requirement.normalizedName),
  );
  const verifiedMatchingPreferred = matchingPreferred.filter((requirement) =>
    skills.verified.has(requirement.normalizedName),
  );

  const selfDeclaredMatchingRequired = matchingRequired.filter(
    (requirement) => !skills.verified.has(requirement.normalizedName),
  );
  const selfDeclaredMatchingPreferred = matchingPreferred.filter(
    (requirement) => !skills.verified.has(requirement.normalizedName),
  );

  const notEvidencedRequired = requiredRequirements.filter(
    (requirement) => !skills.all.has(requirement.normalizedName),
  );
  const notEvidencedPreferred = preferredRequirements.filter(
    (requirement) => !skills.all.has(requirement.normalizedName),
  );

  const requiredCoverage =
    requiredRequirements.length > 0
      ? (matchingRequired.length / requiredRequirements.length) * 100
      : null;
  const preferredCoverage =
    preferredRequirements.length > 0
      ? (matchingPreferred.length / preferredRequirements.length) * 100
      : null;

  let skillScore = 0;
  if (requiredCoverage !== null && preferredCoverage !== null) {
    // Required skills dominate the skill component. Preferred skills support
    // ranking but cannot independently act as a mandatory criterion.
    skillScore = requiredCoverage * 0.8 + preferredCoverage * 0.2;
  } else if (requiredCoverage !== null) {
    skillScore = requiredCoverage;
  } else if (preferredCoverage !== null) {
    skillScore = preferredCoverage;
  }

  const requiredExp = parseRequiredExperienceYears(job);
  const experience = candidateExperienceEvidence(candidate);
  const experienceEvidenceAvailable = requiredExp === 0 || experience.available;
  const experienceMeetsRequirement =
    requiredExp === 0
      ? true
      : experience.available && experience.years !== null
        ? experience.years >= requiredExp
        : null;
  const experienceScore =
    requiredExp === 0
      ? null
      : experience.available && experience.years !== null
        ? Math.min(100, Math.max(0, (experience.years / requiredExp) * 100))
        : null;

  const hasSkillRequirements = requirements.length > 0;
  const hasExperienceRequirement = requiredExp > 0;
  const weightedDimensions = [
    ...(hasSkillRequirements && skills.available
      ? [{ score: skillScore, weight: Math.max(0, config.weightSkills) }]
      : []),
    ...(hasExperienceRequirement && experienceScore !== null
      ? [{ score: experienceScore, weight: Math.max(0, config.weightExperience) }]
      : []),
  ].filter((dimension) => dimension.weight > 0);

  const totalWeight = weightedDimensions.reduce(
    (total, dimension) => total + dimension.weight,
    0,
  );
  const rawScore =
    totalWeight > 0
      ? weightedDimensions.reduce(
          (total, dimension) => total + dimension.score * dimension.weight,
          0,
        ) / totalWeight
      : 0;
  const matchScore = Math.round(rawScore);

  const allRequirementsCount = requirements.length;
  const allVerifiedMatches =
    verifiedMatchingRequired.length + verifiedMatchingPreferred.length;

  return {
    matchScore,
    requiredSkills: requiredRequirements.map((item) => item.name),
    preferredSkills: preferredRequirements.map((item) => item.name),
    matchingSkills: [...matchingRequired, ...matchingPreferred].map(
      (item) => item.name,
    ),
    matchingRequiredSkills: matchingRequired.map((item) => item.name),
    matchingPreferredSkills: matchingPreferred.map((item) => item.name),
    verifiedMatchingSkills: [
      ...verifiedMatchingRequired,
      ...verifiedMatchingPreferred,
    ].map((item) => item.name),
    verifiedMatchingRequiredSkills: verifiedMatchingRequired.map(
      (item) => item.name,
    ),
    verifiedMatchingPreferredSkills: verifiedMatchingPreferred.map(
      (item) => item.name,
    ),
    selfDeclaredMatchingSkills: [
      ...selfDeclaredMatchingRequired,
      ...selfDeclaredMatchingPreferred,
    ].map((item) => item.name),
    selfDeclaredMatchingRequiredSkills: selfDeclaredMatchingRequired.map(
      (item) => item.name,
    ),
    selfDeclaredMatchingPreferredSkills: selfDeclaredMatchingPreferred.map(
      (item) => item.name,
    ),
    // Kept for backwards-compatible consumers, but "missing" means "not
    // evidenced in the profile", never "candidate cannot do this skill".
    missingSkills: [...notEvidencedRequired, ...notEvidencedPreferred].map(
      (item) => item.name,
    ),
    notEvidencedRequiredSkills: notEvidencedRequired.map((item) => item.name),
    notEvidencedPreferredSkills: notEvidencedPreferred.map((item) => item.name),
    verificationCoverage:
      allRequirementsCount > 0
        ? Math.round((allVerifiedMatches / allRequirementsCount) * 100)
        : 0,
    requiredSkillEvidenceCoverage:
      requiredRequirements.length > 0
        ? Math.round((matchingRequired.length / requiredRequirements.length) * 100)
        : null,
    requiredSkillVerificationCoverage:
      requiredRequirements.length > 0
        ? Math.round(
            (verifiedMatchingRequired.length / requiredRequirements.length) * 100,
          )
        : null,
    candidateSkillEvidenceAvailable: skills.available,
    experienceRequirementYears: requiredExp,
    candidateExperienceYears: experience.years,
    experienceEvidenceAvailable,
    experienceMeetsRequirement,
    jobRequirementsAvailable: hasSkillRequirements || hasExperienceRequirement,
    evidenceAvailable: skills.available || experience.available,
    breakdown: {
      skillScore: hasSkillRequirements && skills.available ? Math.round(skillScore) : null,
      experienceScore:
        experienceScore === null ? null : Math.round(experienceScore),
      educationScore: null,
    },
  };
}

export function evaluateCandidateScreening(
  match: ReturnType<typeof computeMatchScore>,
) {
  const input: EvidenceFirstScreeningInput = {
    requiredSkills: match.requiredSkills,
    preferredSkills: match.preferredSkills,
    matchingRequiredSkills: match.matchingRequiredSkills,
    verifiedMatchingRequiredSkills: match.verifiedMatchingRequiredSkills,
    selfDeclaredMatchingRequiredSkills: match.selfDeclaredMatchingRequiredSkills,
    notEvidencedRequiredSkills: match.notEvidencedRequiredSkills,
    experienceRequirementYears: match.experienceRequirementYears,
    candidateExperienceYears: match.candidateExperienceYears,
    experienceEvidenceAvailable: match.experienceEvidenceAvailable,
    experienceMeetsRequirement: match.experienceMeetsRequirement,
    candidateSkillEvidenceAvailable: match.candidateSkillEvidenceAvailable,
    jobRequirementsAvailable: match.jobRequirementsAvailable,
  };
  return evaluateEvidenceFirstScreening(input);
}

export async function batchMatchCandidates(jobId: string, options?: any) {
  void options;
  const job = await prisma.jobListing.findUnique({
    where: { id: jobId },
    include: {
      applications: {
        include: {
          candidateProfile: {
            include: {
              candidateSkills: true,
            },
          },
        },
      },
    },
  });

  if (!job) throw new Error("Job not found");

  let statusUnchanged = 0;
  const results = [];
  let unavailableApplicantSignals = 0;
  let reconfirmationRequired = 0;

  for (const app of job.applications) {
    const candidate = app.candidateProfile;
    if (!candidate) continue;
    const availability = candidate.availabilityStatus;

    // An application is an explicit expression of interest in this specific
    // job. Global availability is informative here; it must not hide or reject
    // an organic applicant.
    if (
      availability === "NOT_LOOKING" ||
      availability === "JOINED" ||
      availability === "TEMPORARILY_UNAVAILABLE"
    ) {
      unavailableApplicantSignals++;
    }
    if (availability === "RECONFIRMATION_REQUIRED") {
      reconfirmationRequired++;
    }

    const match = computeMatchScore(candidate, job);
    const screening = evaluateCandidateScreening(match);

    const summary = [
      `Evidence-first recommendation: ${screening.disposition}.`,
      `Rules-based compatibility: ${match.matchScore}%.`,
      `Required skills evidenced: ${match.matchingRequiredSkills.length}/${match.requiredSkills.length}.`,
      match.notEvidencedRequiredSkills.length > 0
        ? `Required skills not yet evidenced: ${match.notEvidencedRequiredSkills.join(", ")}.`
        : "No required-skill evidence gaps recorded.",
      "Missing profile evidence never authorizes automatic rejection.",
    ].join(" ");

    await prisma.application.update({
      where: { id: app.id },
      data: {
        matchScore: match.matchScore,
        aiSummary: summary,
      },
    });
    statusUnchanged++;

    results.push({
      applicationId: app.id,
      candidateId: candidate.id,
      availabilityStatus: availability,
      availabilityConfirmedAt: candidate.lastAvailabilityConfirmedAt,
      screening,
      ...match,
    });
  }

  return {
    matchedCount: results.length,
    evaluatedApplications: job.applications.length,
    unavailableApplicantSignals,
    reconfirmationRequired,
    statusUnchanged,
    automaticRejections: 0,
    screeningPolicy: "EVIDENCE_FIRST_NO_AUTO_REJECT",
    results,
  };
}
