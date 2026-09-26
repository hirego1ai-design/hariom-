export const SUBSCRIPTION_FEATURE_OPTIONS = [
  { key: "JOB_POSTING", label: "Job Posting", description: "Publish jobs using purchased job-post credits." },
  { key: "AI_JD_GENERATION", label: "AI JD Generation", description: "Generate and refine job descriptions with HireGo AI." },
  { key: "MATCHING_SCORE", label: "Candidate Matching", description: "Show evidence-based candidate-to-job matching scores." },
  { key: "ASSESSMENTS", label: "Assessments", description: "Create and manage job assessments." },
  { key: "VIRTUAL_INTERVIEW", label: "Virtual Interview", description: "Use the secure multi-participant HireGo interview room." },
  { key: "PROCTORING", label: "Proctoring Evidence", description: "Capture advisory browser telemetry for human review." },
  { key: "CANDIDATE_COMPARISON", label: "Candidate Comparison", description: "Compare candidate evidence side by side." },
  { key: "INTERVIEW_WORKFLOW", label: "Interview Workflow", description: "Rounds, scheduling, feedback and next-step workflow." },
  { key: "ANALYTICS", label: "Hiring Analytics", description: "Access authoritative hiring funnel analytics." },
  { key: "TEAM_COLLABORATION", label: "Team Collaboration", description: "Invite recruiters and collaborate as a hiring team." },
  { key: "PROACTIVE_SOURCING", label: "Proactive Sourcing", description: "Search the HireGo talent pool for relevant candidates." },
  { key: "OFFER_WORKFLOW", label: "Offer Workflow", description: "Create, send and track candidate offers." },
  { key: "COPILOT", label: "HireGo Co-Pilot", description: "Allow Co-Pilot to actively assist the hiring workflow with human approvals." },
] as const;

export const SUBSCRIPTION_FEATURE_KEYS = SUBSCRIPTION_FEATURE_OPTIONS.map(option => option.key) as [
  (typeof SUBSCRIPTION_FEATURE_OPTIONS)[number]["key"],
  ...(typeof SUBSCRIPTION_FEATURE_OPTIONS)[number]["key"][],
];

export type SubscriptionFeatureKey = (typeof SUBSCRIPTION_FEATURE_OPTIONS)[number]["key"];
