export type JobStatus = "ACTIVE" | "DRAFT" | "PAUSED" | "CLOSED";
export type ApplicationStage = "Applied" | "AI Screening" | "Technical Interview" | "HR Interview" | "Assessment" | "Offer" | "Hired" | "Rejected";

export interface JobListing {
  id: string;
  title: string;
  company: string;
  companyId?: string;
  location: string;
  type: string;
  salary: string;
  salaryRange?: { min: number; max: number; currency: string };
  department?: string;
  description?: string;
  requirements?: string[];
  status: JobStatus;
  applicationsCount?: number;
  activityLevel?: "high" | "medium" | "low";
  postedDate?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface DbJob extends JobListing {}

export interface Application {
  id: string;
  jobId: string;
  candidateProfileId: string;
  candidateName?: string;
  stage: ApplicationStage;
  matchScore: number;
  aiSummary?: string;
  appliedDate: string;
  updatedAt?: Date;
}
