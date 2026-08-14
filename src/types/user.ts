export type UserRole = "CANDIDATE" | "EMPLOYER" | "RECRUITER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phoneNumber?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface DbUser extends User {
  passwordHash: string;
}

export interface EmployerProfile {
  id: string;
  userId: string;
  companyId: string;
  designation: string;
  department?: string;
}

export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  website?: string;
  description?: string;
  industry?: string;
  size?: string;
  location?: string;
  gstin?: string;
  pan?: string;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills: string[];
  experienceYears: number;
  hireGoScore?: number;
  resumeUrl?: string;
  isVerified?: boolean;
}
