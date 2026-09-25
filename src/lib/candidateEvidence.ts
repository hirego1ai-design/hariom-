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
    availabilityStatus: string;
    lastAvailabilityConfirmedAt: Date | null;
    readinessRecords: { roleTitle: string; seniority: string; score: number | null; validUntil: Date | null }[];
    candidateSkills?: {
      name: string;
      claimedLevel: string;
      verifiedLevel: string | null;
      verificationStatus: string;
      latestScore: number | null;
      verifiedAt: Date | null;
      validUntil: Date | null;
    }[];
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
    videoResumeId: profile.videoResumes[0]?.id ?? null,
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
    availability: profile.availabilityStatus,
    availabilityConfirmedAt: profile.lastAvailabilityConfirmedAt?.toISOString() || null,
    jobReady: profile.readinessRecords.some((record) => !record.validUntil || record.validUntil > new Date()),
    jobReadyRecords: profile.readinessRecords,
    skills: (profile.candidateSkills ?? []).map((skill) => {
      const expired = !!skill.validUntil && skill.validUntil <= new Date();
      const verificationStatus = expired ? "EXPIRED" : skill.verificationStatus;
      return {
        name: skill.name,
        claimedLevel: skill.claimedLevel.toLowerCase(),
        verifiedLevel: skill.verifiedLevel?.toLowerCase() ?? null,
        verificationStatus,
        latestScore: ["ASSESSMENT_VALIDATED", "VERIFIED"].includes(verificationStatus) ? skill.latestScore : null,
        verifiedAt: ["ASSESSMENT_VALIDATED", "VERIFIED"].includes(verificationStatus)
          ? skill.verifiedAt?.toISOString() ?? null
          : null,
        validUntil: ["ASSESSMENT_VALIDATED", "VERIFIED"].includes(verificationStatus)
          ? skill.validUntil?.toISOString() ?? null
          : null,
      };
    }),
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
