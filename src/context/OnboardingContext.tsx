"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CandidateRole = "student" | "fresher" | "experienced" | "freelancer" | "intern" | "career-switcher";

export type JobCategory =
  | "software-engineering"
  | "customer-support"
  | "sales"
  | "hr"
  | "marketing"
  | "finance"
  | "data-entry"
  | "operations"
  | "bpo"
  | "healthcare"
  | "logistics";

export interface SkillEntry {
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
}

export interface EducationEntry {
  degree: string;
  university: string;
  year: string;
  gpa: string;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ResumeAnalysis {
  qualityScore: number;
  extractedSkills: string[];
  experienceYears: number;
  missingFields: string[];
  summary: string;
  improvements: string[];
}

export interface VideoAnalysis {
  communicationScore: number;
  clarityScore: number;
  confidenceScore: number;
  professionalismScore: number;
  bodyLanguageScore: number;
  fluencyScore: number;
  overallScore: number;
}

export interface AssessmentResult {
  category: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTakenSec: number;
}

export interface HireGoScore {
  overall: number;
  resumeQuality: number;
  skills: number;
  experience: number;
  education: number;
  videoAnalysis: number;
  assessmentScore: number;
  communicationScore: number;
  technicalScore: number;
  behaviourScore: number;
}

export interface OnboardingState {
  currentStep: number;
  completedSteps: number[];
  completionPercent: number;
  candidateRole: CandidateRole | null;
  jobCategory: JobCategory | null;
  targetRole: string;
  personalDetails: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    dateOfBirth: string;
    linkedinUrl: string;
  };
  education: EducationEntry[];
  experience: ExperienceEntry[];
  skills: SkillEntry[];
  resumeUploaded: boolean;
  resumeAnalysis: ResumeAnalysis | null;
  videoRecorded: boolean;
  videoAnalysis: VideoAnalysis | null;
  baselineAssessmentCompleted: boolean;
  assessmentResults: AssessmentResult[];
  hireGoScore: HireGoScore | null;
  interviewEligibility: "ready-ai" | "needs-assessment" | "needs-improvement" | "ready-employer" | null;
  userId: string | null;
  companyName: string | null;
}

interface OnboardingContextValue {
  state: OnboardingState;
  updateState: (partial: Partial<OnboardingState>) => void;
  markStepComplete: (step: number) => void;
  calculateHireGoScore: () => HireGoScore;
  resetOnboarding: () => void;
}

const defaultState: OnboardingState = {
  currentStep: 1,
  completedSteps: [],
  completionPercent: 0,
  candidateRole: null,
  jobCategory: null,
  targetRole: "",
  personalDetails: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    dateOfBirth: "",
    linkedinUrl: "",
  },
  education: [],
  experience: [],
  skills: [],
  resumeUploaded: false,
  resumeAnalysis: null,
  videoRecorded: false,
  videoAnalysis: null,
  baselineAssessmentCompleted: false,
  assessmentResults: [],
  hireGoScore: null,
  interviewEligibility: null,
  userId: null,
  companyName: null,
};

const STORAGE_KEY = "hirego_onboarding_v1";

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  // Start with the same state on the server and browser. Restoring localStorage
  // during the first browser render causes hydration mismatches with SSR.
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [hasRestoredSavedState, setHasRestoredSavedState] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setState(JSON.parse(saved));
    } catch {}
    setHasRestoredSavedState(true);
  }, []);

  useEffect(() => {
    if (!hasRestoredSavedState) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [hasRestoredSavedState, state]);

  const updateState = (partial: Partial<OnboardingState>) => {
    setState((prev) => {
      const next = { ...prev, ...partial };
      const totalSteps = 10;
      next.completionPercent = Math.round((next.completedSteps.length / totalSteps) * 100);
      return next;
    });
  };

  const markStepComplete = (step: number) => {
    setState((prev) => {
      const completed = prev.completedSteps.includes(step)
        ? prev.completedSteps
        : [...prev.completedSteps, step];
      const completionPercent = Math.round((completed.length / 10) * 100);
      return { ...prev, completedSteps: completed, completionPercent };
    });
  };

  const calculateHireGoScore = (): HireGoScore => {
    const resumeQuality = state.resumeAnalysis?.qualityScore ?? 0;
    const skillsScore = Math.min(100, state.skills.length * 15);
    const experienceScore = Math.min(100, state.experience.length * 25);
    const educationScore = Math.min(100, state.education.length * 35);
    const videoScore = state.videoAnalysis?.overallScore ?? 0;
    const assessmentScore =
      state.assessmentResults.length > 0
        ? Math.round(
            state.assessmentResults.reduce((sum, r) => sum + (r.correctAnswers / r.totalQuestions) * 100, 0) /
              state.assessmentResults.length
          )
        : 0;
    const communicationScore = state.videoAnalysis
      ? Math.round((state.videoAnalysis.communicationScore + state.videoAnalysis.clarityScore + state.videoAnalysis.fluencyScore) / 3)
      : 0;
    const technicalScore = assessmentScore;
    const behaviourScore = state.videoAnalysis
      ? Math.round((state.videoAnalysis.confidenceScore + state.videoAnalysis.professionalismScore + state.videoAnalysis.bodyLanguageScore) / 3)
      : 0;

    const overall = Math.round(
      resumeQuality * 0.15 +
        skillsScore * 0.1 +
        experienceScore * 0.1 +
        educationScore * 0.05 +
        videoScore * 0.2 +
        assessmentScore * 0.2 +
        communicationScore * 0.1 +
        behaviourScore * 0.1
    );

    const score: HireGoScore = {
      overall,
      resumeQuality,
      skills: skillsScore,
      experience: experienceScore,
      education: educationScore,
      videoAnalysis: videoScore,
      assessmentScore,
      communicationScore,
      technicalScore,
      behaviourScore,
    };

    setState((prev) => ({ ...prev, hireGoScore: score }));
    return score;
  };

  const resetOnboarding = () => {
    setState(defaultState);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <OnboardingContext.Provider
      value={{ state, updateState, markStepComplete, calculateHireGoScore, resetOnboarding }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return ctx;
}


