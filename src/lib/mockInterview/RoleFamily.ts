import { findRole } from "@/lib/skill-master";

export type MockRoleFamily =
  | "ENGINEERING"
  | "SALES"
  | "HR"
  | "OPERATIONS"
  | "CUSTOMER_SUCCESS"
  | "PRODUCT"
  | "MARKETING"
  | "FINANCE"
  | "LEADERSHIP"
  | "GENERAL";

export type MockSeniority = "JUNIOR" | "MID" | "SENIOR" | "STAFF_LEAD";

const DEPARTMENT_FAMILY: Record<string, MockRoleFamily> = {
  Engineering: "ENGINEERING",
  "Data & Analytics": "ENGINEERING",
  Sales: "SALES",
  "Human Resources": "HR",
  Operations: "OPERATIONS",
  "BPO & Customer Operations": "OPERATIONS",
  "Travel & Hospitality": "OPERATIONS",
  "Banking & Financial Operations": "FINANCE",
  "Risk & Compliance": "FINANCE",
  "Customer Support": "CUSTOMER_SUCCESS",
  "Customer Success": "CUSTOMER_SUCCESS",
  Product: "PRODUCT",
  Marketing: "MARKETING",
  Finance: "FINANCE",
};

export function normalizeMockSeniority(value: string): MockSeniority {
  const normalized = value.trim().toLowerCase().replace(/[_-]+/g, " ");
  if (normalized === "junior" || normalized === "entry" || normalized === "entry level") return "JUNIOR";
  if (normalized === "mid" || normalized === "mid level" || normalized === "intermediate") return "MID";
  if (normalized === "senior") return "SENIOR";
  if (normalized === "staff" || normalized === "lead" || normalized === "staff lead" || normalized === "staff/lead") return "STAFF_LEAD";
  throw new Error("Unsupported mock interview seniority.");
}

export function seniorityLabel(value: MockSeniority): string {
  if (value === "JUNIOR") return "Junior";
  if (value === "MID") return "Mid-Level";
  if (value === "SENIOR") return "Senior";
  return "Staff/Lead";
}

export function startingDifficulty(value: MockSeniority): number {
  if (value === "JUNIOR") return 1;
  if (value === "MID") return 2;
  if (value === "SENIOR") return 3;
  return 4;
}

export function resolveMockRoleFamily(roleTarget: string): MockRoleFamily {
  const role = findRole(roleTarget);
  if (!role) return "GENERAL";

  const departmentFamily = DEPARTMENT_FAMILY[role.department];
  if (departmentFamily) return departmentFamily;

  const lower = role.title.toLowerCase();
  if (/\b(head|director|vice president|vp|chief)\b/.test(lower)) return "LEADERSHIP";
  return "GENERAL";
}
