export type InterviewStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";

export interface Interview {
  id: string;
  candidateName: string;
  candidateProfileId?: string;
  applicationId?: string;
  jobTitle: string;
  jobId?: string;
  scheduledAt?: string;
  time?: string;
  durationMins?: number;
  type: string;
  status: InterviewStatus | string;
  roomUrl?: string;
  transcript?: string;
  aiFeedback?: string;
}

export interface VideoResume {
  id: string;
  candidateProfileId: string;
  videoUrl: string;
  durationSeconds: number;
  transcript?: string;
  communicationScore?: number;
  confidenceScore?: number;
  clarityScore?: number;
  professionalismScore?: number;
}
