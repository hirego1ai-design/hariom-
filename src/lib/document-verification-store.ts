export interface DevDocumentVerificationRecord {
  id: string;
  employerId: string;
  employerName: string;
  companyName: string;
  docType: string;
  fileUrl: string;
  fileName: string;
  submittedAt: string;
  status: "Pending Audit" | "Verified" | "Rejected";
  riskScore: "Low" | "Medium" | "High";
}

const globalStore = globalThis as typeof globalThis & {
  __hiregoDevDocumentVerifications?: DevDocumentVerificationRecord[];
};

const records = globalStore.__hiregoDevDocumentVerifications ?? [];
globalStore.__hiregoDevDocumentVerifications = records;

export function createDevDocumentVerification(
  input: Omit<DevDocumentVerificationRecord, "id" | "submittedAt" | "status">
) {
  const record: DevDocumentVerificationRecord = {
    ...input,
    id: `dev-document-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    submittedAt: new Date().toISOString(),
    status: "Pending Audit",
  };
  records.unshift(record);
  return record;
}

export function getDevDocumentVerifications() {
  return records;
}
