export type KnowledgeScreeningTier = "BASIC_OPERATIONAL" | "PROFESSIONAL" | "TECHNICAL";

export type KnowledgeScreeningPolicy = {
  tier: KnowledgeScreeningTier;
  minQuestions: number;
  maxQuestions: number;
  recommendedQuestions: number;
  recommendedDurationMinutes: number;
  label: string;
};

const TECHNICAL_KEYWORDS = [
  "developer", "engineer", "software", "frontend", "front end", "backend", "back end",
  "full stack", "fullstack", "programmer", "devops", "site reliability", "sre", "cloud",
  "cybersecurity", "cyber security", "security engineer", "network engineer", "database",
  "data engineer", "data scientist", "machine learning", "ml engineer", "ai engineer",
  "artificial intelligence", "qa automation", "automation engineer", "solution architect",
  "technical architect", "mobile developer", "android developer", "ios developer",
];

const BASIC_OPERATIONAL_KEYWORDS = [
  "administrator", "admin", "office assistant", "office executive", "receptionist",
  "data entry", "back office", "operations executive", "operation executive",
  "operations associate", "operation associate", "coordinator", "warehouse",
  "dispatch", "inventory assistant", "customer support", "support executive",
  "telecaller", "call center", "process associate", "documentation executive",
];

export const MIN_QUESTIONS_PER_SKILL = 3;

export function getKnowledgeScreeningPolicy(
  roleTitle?: string | null,
  department?: string | null,
): KnowledgeScreeningPolicy {
  const haystack = `${roleTitle ?? ""} ${department ?? ""}`.trim().toLowerCase();

  if (TECHNICAL_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return {
      tier: "TECHNICAL",
      minQuestions: 15,
      maxQuestions: 18,
      recommendedQuestions: 16,
      recommendedDurationMinutes: 15,
      label: "Technical knowledge screening",
    };
  }

  if (BASIC_OPERATIONAL_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return {
      tier: "BASIC_OPERATIONAL",
      minQuestions: 10,
      maxQuestions: 12,
      recommendedQuestions: 11,
      recommendedDurationMinutes: 10,
      label: "Basic / operational knowledge screening",
    };
  }

  return {
    tier: "PROFESSIONAL",
    minQuestions: 12,
    maxQuestions: 15,
    recommendedQuestions: 13,
    recommendedDurationMinutes: 12,
    label: "Professional knowledge screening",
  };
}
