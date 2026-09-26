export type ScreeningDisposition =
  | "SHORTLIST_RECOMMENDED"
  | "ASSESSMENT_RECOMMENDED"
  | "HUMAN_REVIEW_REQUIRED";

export interface EvidenceFirstScreeningInput {
  requiredSkills: string[];
  preferredSkills: string[];
  matchingRequiredSkills: string[];
  verifiedMatchingRequiredSkills: string[];
  selfDeclaredMatchingRequiredSkills: string[];
  notEvidencedRequiredSkills: string[];
  experienceRequirementYears: number;
  candidateExperienceYears: number | null;
  experienceEvidenceAvailable: boolean;
  experienceMeetsRequirement: boolean | null;
  candidateSkillEvidenceAvailable: boolean;
  jobRequirementsAvailable: boolean;
}

export interface EvidenceFirstScreeningResult {
  disposition: ScreeningDisposition;
  reasons: string[];
  assessmentRecommended: boolean;
  humanReviewRequired: boolean;
  automaticRejectionAllowed: false;
  humanApprovalRequiredForRejection: true;
  policy: "EVIDENCE_FIRST_NO_AUTO_REJECT";
}

/**
 * Evidence-first hiring policy.
 *
 * Missing profile evidence is never treated as proof that a candidate cannot
 * perform the job. The policy can recommend shortlisting, assessment, or human
 * review, but it never authorizes an automatic rejection.
 */
export function evaluateEvidenceFirstScreening(
  input: EvidenceFirstScreeningInput,
): EvidenceFirstScreeningResult {
  const reasons: string[] = [];

  if (!input.jobRequirementsAvailable) {
    reasons.push(
      "The job does not contain enough structured objective requirements for an automatic screening recommendation.",
    );
    return {
      disposition: "HUMAN_REVIEW_REQUIRED",
      reasons,
      assessmentRecommended: false,
      humanReviewRequired: true,
      automaticRejectionAllowed: false,
      humanApprovalRequiredForRejection: true,
      policy: "EVIDENCE_FIRST_NO_AUTO_REJECT",
    };
  }

  if (!input.candidateSkillEvidenceAvailable && input.requiredSkills.length > 0) {
    reasons.push(
      "Required-skill evidence is missing from the candidate profile; missing evidence is not a mismatch.",
    );
  }

  if (input.notEvidencedRequiredSkills.length > 0) {
    reasons.push(
      `Required skills not yet evidenced: ${input.notEvidencedRequiredSkills.join(", ")}. Validate them through assessment or human review before any rejection.`,
    );
  }

  if (
    input.experienceRequirementYears > 0 &&
    !input.experienceEvidenceAvailable
  ) {
    reasons.push(
      "Required experience is not sufficiently evidenced in the profile; validate the candidate rather than treating the missing data as zero experience.",
    );
  }

  if (
    input.experienceRequirementYears > 0 &&
    input.experienceEvidenceAvailable &&
    input.experienceMeetsRequirement === false
  ) {
    reasons.push(
      `Recorded experience is below the parsed ${input.experienceRequirementYears}-year requirement. A human must review relevance, transferable experience, and the job's true mandatory criteria before rejection.`,
    );
    return {
      disposition: "HUMAN_REVIEW_REQUIRED",
      reasons,
      assessmentRecommended: true,
      humanReviewRequired: true,
      automaticRejectionAllowed: false,
      humanApprovalRequiredForRejection: true,
      policy: "EVIDENCE_FIRST_NO_AUTO_REJECT",
    };
  }

  if (
    input.notEvidencedRequiredSkills.length > 0 ||
    (input.experienceRequirementYears > 0 &&
      !input.experienceEvidenceAvailable) ||
    input.selfDeclaredMatchingRequiredSkills.length > 0
  ) {
    if (input.selfDeclaredMatchingRequiredSkills.length > 0) {
      reasons.push(
        `Self-declared required skills need validation: ${input.selfDeclaredMatchingRequiredSkills.join(", ")}.`,
      );
    }
    return {
      disposition: "ASSESSMENT_RECOMMENDED",
      reasons,
      assessmentRecommended: true,
      humanReviewRequired: false,
      automaticRejectionAllowed: false,
      humanApprovalRequiredForRejection: true,
      policy: "EVIDENCE_FIRST_NO_AUTO_REJECT",
    };
  }

  const allRequiredSkillsCovered =
    input.requiredSkills.length === 0 ||
    input.matchingRequiredSkills.length === input.requiredSkills.length;
  const requiredSkillsVerified =
    input.requiredSkills.length === 0 ||
    input.verifiedMatchingRequiredSkills.length === input.requiredSkills.length;
  const experienceSatisfied =
    input.experienceRequirementYears === 0 ||
    input.experienceMeetsRequirement === true;

  if (
    allRequiredSkillsCovered &&
    requiredSkillsVerified &&
    experienceSatisfied
  ) {
    reasons.push(
      "All structured required skills are evidenced and verified, and the recorded experience requirement is satisfied when one exists.",
    );
    if (input.preferredSkills.length > 0) {
      reasons.push(
        "Preferred skills are supporting signals only and never act as mandatory rejection criteria.",
      );
    }
    return {
      disposition: "SHORTLIST_RECOMMENDED",
      reasons,
      assessmentRecommended: false,
      humanReviewRequired: false,
      automaticRejectionAllowed: false,
      humanApprovalRequiredForRejection: true,
      policy: "EVIDENCE_FIRST_NO_AUTO_REJECT",
    };
  }

  reasons.push(
    "Available evidence is mixed or incomplete; route the candidate to human review instead of rejecting automatically.",
  );
  return {
    disposition: "HUMAN_REVIEW_REQUIRED",
    reasons,
    assessmentRecommended: false,
    humanReviewRequired: true,
    automaticRejectionAllowed: false,
    humanApprovalRequiredForRejection: true,
    policy: "EVIDENCE_FIRST_NO_AUTO_REJECT",
  };
}
