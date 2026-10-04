import assert from "node:assert/strict";
import test from "node:test";
import {
  buildIndexNowPayload,
  buildJobMetadata,
  buildJobPostingSchema,
  normalizeHireGoCanonical,
  publicUrl,
} from "@/lib/publicDiscovery";

const job = {
  id: "job-123",
  title: "React Developer",
  department: "Engineering",
  location: "Noida",
  type: "Full-time",
  workMode: "Hybrid",
  experienceLevel: "Mid-level",
  numberOfOpenings: 2,
  salaryRange: "₹12–18 LPA",
  description: "Build and maintain production React applications.",
  requirements: ["React", "TypeScript", "3+ years experience"],
  publishedAt: new Date("2026-10-04T10:00:00.000Z"),
  expiresAt: new Date("2026-11-04T10:00:00.000Z"),
  updatedAt: new Date("2026-10-04T10:00:00.000Z"),
  company: {
    name: "Example Employer",
    logoUrl: "/marketing/hirego-logo.png",
    website: "https://example.com",
    description: "Example employer",
    location: "Noida",
  },
};

test("canonical HireGo URLs always use www host", () => {
  assert.equal(publicUrl("/jobs/job-123"), "https://www.hiregoai.com/jobs/job-123");
  assert.equal(
    normalizeHireGoCanonical("https://hiregoai.com/blog/example", "/blog/example"),
    "https://www.hiregoai.com/blog/example",
  );
});

test("job metadata is deterministic and uses employer-provided job title", () => {
  const metadata = buildJobMetadata(job);
  assert.equal(metadata.title, "React Developer — Example Employer | HireGo AI");
  assert.equal(metadata.alternates?.canonical, "https://www.hiregoai.com/jobs/job-123");
});

test("JobPosting schema contains one real job and does not invent numeric salary", () => {
  const schema = buildJobPostingSchema(job) as Record<string, unknown>;
  assert.equal(schema["@type"], "JobPosting");
  assert.equal(schema.title, "React Developer");
  assert.equal(schema.employmentType, "FULL_TIME");
  assert.equal(schema.baseSalary, undefined);
  assert.equal(schema.url, "https://www.hiregoai.com/jobs/job-123");
});

test("IndexNow payload rejects non-HireGo URLs", () => {
  assert.throws(
    () => buildIndexNowPayload(["https://example.com/jobs/1"], "abcdefgh", "https://www.hiregoai.com/indexnow-key.txt"),
    /canonical HireGo host/,
  );
});
