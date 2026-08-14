// Candidate Profile Service
// Handles registration data sync, profile updates, and Universal Candidate Profile storage.

import { candidateProfile, candidateScores, candidateSkills, candidateExperience, candidateProjects, candidateEducation, candidateCertifications, candidateVideoAnalysis } from "@/mocks/candidateProfileData";

export interface CandidateSyncPayload {
  userId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  headline?: string;
  experienceYears?: string;
  location?: string;
  expectedSalary?: string;
  noticePeriod?: string;
  skills?: string[];
  education?: Array<{ institution: string; degree: string; year: string; cgpa?: string }>;
  experience?: Array<{ company: string; role: string; type: string; duration: string }>;
  resumeUrl?: string;
  videoResumeUrl?: string;
  aiScores?: Partial<typeof candidateScores.hiringScore>;
}

const STORAGE_KEY = "hirego_universal_candidate_profile";

/**
 * Get synchronized Universal Candidate Profile data.
 * Merges defaults with any saved registration or user profile updates from localStorage.
 */
export function getUniversalCandidateProfile() {
  if (typeof window === "undefined") {
    return {
      profile: candidateProfile,
      scores: candidateScores,
      skills: candidateSkills,
      experience: candidateExperience,
      projects: candidateProjects,
      education: candidateEducation,
      certifications: candidateCertifications,
      videoAnalysis: candidateVideoAnalysis,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        profile: candidateProfile,
        scores: candidateScores,
        skills: candidateSkills,
        experience: candidateExperience,
        projects: candidateProjects,
        education: candidateEducation,
        certifications: candidateCertifications,
        videoAnalysis: candidateVideoAnalysis,
      };
    }

    const saved = JSON.parse(raw);
    return {
      profile: { ...candidateProfile, ...saved.profile },
      scores: { ...candidateScores, ...saved.scores },
      skills: saved.skills || candidateSkills,
      experience: saved.experience || candidateExperience,
      projects: saved.projects || candidateProjects,
      education: saved.education || candidateEducation,
      certifications: saved.certifications || candidateCertifications,
      videoAnalysis: { ...candidateVideoAnalysis, ...saved.videoAnalysis },
    };
  } catch (err) {
    console.error("Error reading Universal Candidate Profile from storage:", err);
    return {
      profile: candidateProfile,
      scores: candidateScores,
      skills: candidateSkills,
      experience: candidateExperience,
      projects: candidateProjects,
      education: candidateEducation,
      certifications: candidateCertifications,
      videoAnalysis: candidateVideoAnalysis,
    };
  }
}

/**
 * Sync candidate registration or onboarding payload into Universal Profile storage.
 */
export function syncCandidateRegistrationData(payload: CandidateSyncPayload): boolean {
  if (typeof window === "undefined") return false;

  try {
    const current = getUniversalCandidateProfile();

    const updatedProfile = {
      ...current.profile,
      id: payload.userId ? `HGCA-${payload.userId.slice(-6).toUpperCase()}` : current.profile.id,
      name: payload.fullName || current.profile.name,
      email: payload.email || current.profile.email,
      phone: payload.phone || current.profile.phone,
      headline: payload.headline || current.profile.headline,
      experience: payload.experienceYears ? `${payload.experienceYears} Years` : current.profile.experience,
      location: payload.location || current.profile.location,
      expectedSalary: payload.expectedSalary || current.profile.expectedSalary,
      noticePeriod: payload.noticePeriod || current.profile.noticePeriod,
    };

    const updatedData = {
      profile: updatedProfile,
      scores: payload.aiScores ? { ...current.scores, hiringScore: { ...current.scores.hiringScore, ...payload.aiScores } } : current.scores,
      skills: payload.skills ? { ...current.skills, technical: payload.skills.map((s) => ({ name: s, level: "Advanced", years: 3, verified: true })) } : current.skills,
      experience: payload.experience || current.experience,
      education: payload.education || current.education,
      projects: current.projects,
      certifications: current.certifications,
      videoAnalysis: current.videoAnalysis,
      lastSyncedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    console.log(`[HireGo Sync] Universal Candidate Profile synchronized for ${updatedProfile.name} (ID: ${updatedProfile.id}) at ${updatedData.lastSyncedAt}`);
    return true;
  } catch (err) {
    console.error("[HireGo Sync Error] Failed to synchronize candidate registration data:", err);
    return false;
  }
}

/**
 * Reset Universal Profile storage back to default mock data.
 */
export function resetUniversalCandidateProfile(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
