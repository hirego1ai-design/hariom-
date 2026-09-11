import assert from "node:assert/strict";
import { test } from "node:test";
import { formatRecordedScore, recordedCandidateEvidence, toEmployerCandidate } from "../lib/candidateEvidence";

const application = {
  id: "application-a", jobId: "job-a", status: "APPLIED", matchScore: 94,
  createdAt: new Date("2026-09-01T12:00:00Z"), updatedAt: new Date("2026-09-05T13:00:00Z"),
  candidateProfile: { id: "candidate-a", headline: "Engineer", bio: "Candidate supplied bio", location: "Delhi",
    experienceYears: 8.75, user: { name: "Candidate A" }, resumeUrl: "/private/resume.pdf", videoResumes: [] as { id: string }[] },
  job: { title: "Engineer" },
};

test("application match is not fabricated into assessment or interview results", () => {
  const candidate = toEmployerCandidate(application);
  assert.equal(candidate.matchScore, 94);
  assert.equal(candidate.assessmentScore, null);
  assert.equal(candidate.aiInterviewScore, null);
});

test("document resume alone does not indicate a video resume", () => {
  assert.equal(toEmployerCandidate(application).hasVideoResume, false);
  assert.equal(toEmployerCandidate({ ...application, candidateProfile: {
    ...application.candidateProfile, videoResumes: [{ id: "actual-video-row" }],
  } }).hasVideoResume, true);
});

test("candidate supplied biography is separate from recruiter notes and salary/source are not invented", () => {
  const candidate = toEmployerCandidate(application);
  assert.equal(candidate.recruiterNotes, null);
  assert.equal(candidate.candidateBio, "Candidate supplied bio");
  assert.equal(candidate.expectedSalary, "Not provided");
  assert.equal(candidate.source, "Not recorded");
  assert.equal(candidate.partner, "Not recorded");
  assert.equal(candidate.experience, "8.75y Exp");
  assert.equal(candidate.lastActivity, application.updatedAt.toISOString());
});

test("absent, invalid and out-of-range scores show unavailable while a recorded zero remains zero", () => {
  for (const score of [null, undefined, Number.NaN, Infinity, -1, 101, "90"]) {
    assert.equal(formatRecordedScore(score), "Not available");
  }
  assert.equal(formatRecordedScore(0), "0/100");
});

test("candidate explanation contains only recorded metrics, with no invented match factors or outcome probabilities", () => {
  assert.deepEqual(recordedCandidateEvidence(toEmployerCandidate(application)), [
    { label: "Recorded application match", value: "94/100" },
    { label: "Employer assessment", value: "Not available" },
    { label: "Employer AI interview", value: "Not available" },
  ]);
});
