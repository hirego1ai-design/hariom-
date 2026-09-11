type EmployerApplicationEvidence = {
  id: string;
  jobId: string;
  status: string;
  matchScore: number;
  createdAt: Date;
  updatedAt: Date;
  candidateProfile: {
    id: string;
    headline: string | null;
    bio: string | null;
    location: string | null;
    experienceYears: number;
    user: { name: string } | null;
    videoResumes: { id: string }[];
  };
  job: { title: string };
};

/** Only the application match score is currently available in this query.
 * A match score is not an assessment result, interview score or prediction.
 */
export function toEmployerCandidate(app: EmployerApplicationEvidence) {
  const profile = app.candidateProfile;
  const name = profile.user?.name || profile.headline || "Unknown";
  return {
    id: profile.id,
    applicationId: app.id,
    name,
    matchScore: app.matchScore,
    experience: `${profile.experienceYears}y Exp`,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
    stage: app.status === "APPLIED" ? "SCREENING" : app.status,
    jobId: app.jobId,
    currentRole: profile.headline || "Not provided",
    appliedJob: app.job.title,
    education: "Not available",
    currentCompany: "Not available",
    expectedSalary: "Not provided",
    noticePeriod: "Not provided",
    currentLocation: profile.location || "Not provided",
    preferredLocation: "Not provided",
    hasVideoResume: profile.videoResumes.length > 0,
    assessmentScore: null,
    aiInterviewScore: null,
    recruiterNotes: null,
    candidateBio: profile.bio,
    recommendation: "Not assessed",
    recommendationReason: "No recorded hiring recommendation is available.",
    source: "Not recorded",
    partner: "Not recorded",
    applicationDate: app.createdAt.toISOString().split("T")[0],
    lastActivity: app.updatedAt.toISOString(),
    availability: "Not provided",
  };
}

export function formatRecordedScore(score: unknown): string {
  return typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= 100
    ? `${score}/100` : "Not available";
}

export function recordedCandidateEvidence(candidate: { matchScore?: unknown; assessmentScore?: unknown; aiInterviewScore?: unknown }) {
  return [
    { label: "Recorded application match", value: formatRecordedScore(candidate.matchScore) },
    { label: "Employer assessment", value: formatRecordedScore(candidate.assessmentScore) },
    { label: "Employer AI interview", value: formatRecordedScore(candidate.aiInterviewScore) },
  ];
}
