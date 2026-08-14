import { create } from "zustand";

export interface CandidateState {
  headline: string;
  bio: string;
  location: string;
  skills: string[];
  experienceYears: number;
  savedJobIds: string[];
  appliedJobIds: string[];
  setProfile: (profile: Partial<CandidateState>) => void;
  toggleSaveJob: (jobId: string) => void;
  addAppliedJob: (jobId: string) => void;
}

export const useCandidateStore = create<CandidateState>((set) => ({
  headline: "",
  bio: "",
  location: "Bangalore, India",
  skills: [],
  experienceYears: 0,
  savedJobIds: [],
  appliedJobIds: [],
  setProfile: (profile) => set((state) => ({ ...state, ...profile })),
  toggleSaveJob: (jobId) =>
    set((state) => ({
      savedJobIds: state.savedJobIds.includes(jobId)
        ? state.savedJobIds.filter((id) => id !== jobId)
        : [...state.savedJobIds, jobId],
    })),
  addAppliedJob: (jobId) =>
    set((state) => ({
      appliedJobIds: state.appliedJobIds.includes(jobId) ? state.appliedJobIds : [...state.appliedJobIds, jobId],
    })),
}));
