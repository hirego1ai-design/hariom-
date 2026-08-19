import { create } from 'zustand';

export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
export type WorkMode = 'On-site' | 'Remote' | 'Hybrid';
export type ExperienceLevel = 'Entry-level' | 'Mid-level' | 'Senior' | 'Lead' | 'Director';
export type ToneOfVoice = 'Professional' | 'Casual' | 'Academic' | 'Urgent';
export type ProctoringLevel = 'Standard' | 'High Security';
export type JobSkillRequirement = {
  name: string;
  priority: 'required' | 'preferred';
};

interface JobCreationState {
  // Step 1: Basic Info
  jobTitle: string;
  department: string;
  selectedRoles: string[];
  categories: string[];
  jobType: JobType;
  workMode: WorkMode;
  location: string;
  deadline: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  salaryPeriod: string;
  experienceLevel: ExperienceLevel;
  numberOfOpenings: string;
  
  // Step 2: JD Writer
  coreResponsibilities: string;
  toneOfVoice: ToneOfVoice;
  keyRequirements: string;
  mission: string;
  whoYouAre: string;
  perks: string;
  referenceJd: string;
  aiFocusAreas: string;
  
  // Step 3: Requirements
  skillTags: string[];
  skillRequirements: JobSkillRequirement[];
  educationRequirement: string;
  screeningQuestions: string[];
  
  // Step 4: Matching Config
  autoArchiveThreshold: boolean;
  autoArchiveScore: number;
  autoInterview: boolean;
  autoInterviewLimit: number;
  boostJob: boolean;
  notifyMatches: boolean;
  proctoringLevel: ProctoringLevel;
  weightExperience: number;
  weightEducation: number;
  weightSkills: number;

  // Actions
  updateField: (field: keyof Omit<JobCreationState, 'updateField' | 'reset'>, value: any) => void;
  reset: () => void;
}

const initialState = {
  jobTitle: '',
  department: '',
  selectedRoles: [] as string[],
  categories: [] as string[],
  jobType: 'Full-time' as JobType,
  workMode: 'On-site' as WorkMode,
  location: 'India',
  deadline: '',
  salaryMin: '',
  salaryMax: '',
  currency: 'USD',
  salaryPeriod: 'Yearly',
  experienceLevel: 'Mid-level' as ExperienceLevel,
  numberOfOpenings: '1',
  
  coreResponsibilities: '',
  toneOfVoice: 'Professional' as ToneOfVoice,
  keyRequirements: '',
  mission: '',
  whoYouAre: '',
  perks: '',
  referenceJd: '',
  aiFocusAreas: '',
  
  skillTags: [],
  skillRequirements: [],
  educationRequirement: "Bachelor's Degree",
  screeningQuestions: ['', ''],
  
  autoArchiveThreshold: true,
  autoArchiveScore: 70,
  autoInterview: false,
  autoInterviewLimit: 10,
  boostJob: false,
  notifyMatches: true,
  proctoringLevel: 'Standard' as ProctoringLevel,
  weightExperience: 40,
  weightEducation: 20,
  weightSkills: 40,
};

export const useJobCreationStore = create<JobCreationState>((set) => ({
  ...initialState,
  updateField: (field, value) => set((state) => ({ ...state, [field]: value })),
  reset: () => set(initialState),
}));
