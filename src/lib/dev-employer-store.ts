import type { UserRole } from "@/types";

export interface DevEmployerRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  emailVerified: boolean;
  companyId: string;
  companyName: string;
  industry: string;
  companySize: string;
}

const globalStore = globalThis as typeof globalThis & { __hiregoDevEmployers?: Map<string, DevEmployerRecord> };
const employers = globalStore.__hiregoDevEmployers ?? new Map<string, DevEmployerRecord>();
globalStore.__hiregoDevEmployers = employers;

export function getDevEmployer(email: string) {
  return employers.get(email.toLowerCase().trim()) || null;
}

export function createDevEmployer(input: Omit<DevEmployerRecord, "id" | "companyId" | "role" | "emailVerified">) {
  const email = input.email.toLowerCase().trim();
  const record: DevEmployerRecord = { ...input, email, id: `dev-employer-${Date.now()}`, companyId: `dev-company-${Date.now()}`, role: "EMPLOYER", emailVerified: false };
  employers.set(email, record);
  return record;
}

export function markDevEmployerVerified(email: string) {
  const record = getDevEmployer(email);
  if (!record) return null;
  record.emailVerified = true;
  return record;
}
