
export interface CandidateSyncPayload {
  userId?: string; fullName?: string; email?: string; phone?: string; role?: string; headline?: string; experienceYears?: string; location?: string; expectedSalary?: string; noticePeriod?: string; skills?: string[]; education?: Array<{ institution: string; degree: string; year: string; cgpa?: string }>; experience?: Array<{ company: string; role: string; type: string; duration: string }>; resumeUrl?: string; videoResumeUrl?: string; aiScores?: any;
}
export function getUniversalCandidateProfile() {
  throw new Error("UNAVAILABLE: Client-side authoritative mock data has been removed for production.");
}
export function syncCandidateRegistrationData(payload: CandidateSyncPayload): boolean {
  return false;
}
export function resetUniversalCandidateProfile(): void {}

