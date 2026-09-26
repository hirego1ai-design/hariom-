import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  computeMatchScore,
  evaluateCandidateScreening,
} from "../lib/matching/JobMatchingEngine";

const baseJob = {
  description: "Minimum 3 years experience building production applications.",
  requirements: [],
  skillRequirements: [
    { name: "React.js", priority: "required" },
    { name: "AWS", priority: "preferred" },
  ],
  matchingConfig: {
    weightExperience: 40,
    weightEducation: 20,
    weightSkills: 40,
    autoArchiveScore: 70,
    autoInterviewLimit: 10,
  },
};

test("structured required/preferred skill requirements are parsed and preferred gaps do not block shortlist recommendation", () => {
  const match = computeMatchScore(
    {
      experienceYears: 4,
      experience: [{ title: "Frontend Engineer" }],
      candidateSkills: [
        {
          name: "React JS",
          normalizedName: "reactjs",
          verificationStatus: "VERIFIED",
          isVisible: true,
          validUntil: null,
        },
      ],
    },
    baseJob,
  );

  assert.deepEqual(match.requiredSkills, ["React.js"]);
  assert.deepEqual(match.preferredSkills, ["AWS"]);
  assert.deepEqual(match.matchingRequiredSkills, ["React.js"]);
  assert.deepEqual(match.notEvidencedPreferredSkills, ["AWS"]);
  assert.equal(match.experienceMeetsRequirement, true);

  const screening = evaluateCandidateScreening(match);
  assert.equal(screening.disposition, "SHORTLIST_RECOMMENDED");
  assert.equal(screening.automaticRejectionAllowed, false);
});

test("a missing exact keyword is treated as missing evidence and gets an assessment opportunity instead of rejection", () => {
  const match = computeMatchScore(
    {
      experienceYears: 5,
      experience: [{ title: "Frontend Engineer" }],
      candidateSkills: [
        {
          name: "Next.js",
          normalizedName: "nextjs",
          verificationStatus: "VERIFIED",
          isVisible: true,
          validUntil: null,
        },
      ],
    },
    baseJob,
  );

  assert.deepEqual(match.notEvidencedRequiredSkills, ["React.js"]);
  const screening = evaluateCandidateScreening(match);
  assert.equal(screening.disposition, "ASSESSMENT_RECOMMENDED");
  assert.equal(screening.assessmentRecommended, true);
  assert.equal(screening.automaticRejectionAllowed, false);
  assert.equal(screening.humanApprovalRequiredForRejection, true);
});

test("missing experience data is not silently converted into a failed zero-experience signal", () => {
  const match = computeMatchScore(
    {
      experienceYears: 0,
      experience: null,
      candidateSkills: [
        {
          name: "React.js",
          normalizedName: "reactjs",
          verificationStatus: "VERIFIED",
          isVisible: true,
          validUntil: null,
        },
      ],
    },
    baseJob,
  );

  assert.equal(match.experienceEvidenceAvailable, false);
  assert.equal(match.candidateExperienceYears, null);
  assert.equal(match.experienceMeetsRequirement, null);
  // The known skill evidence can still produce a compatibility signal. The
  // missing preferred AWS evidence can lower ranking, but unknown experience
  // must not be scored as a failed zero-experience dimension.
  assert.equal(match.breakdown.experienceScore, null);
  assert.equal(match.matchScore, 80);
  assert.equal(
    evaluateCandidateScreening(match).disposition,
    "ASSESSMENT_RECOMMENDED",
  );
});

test("recorded experience below a stated requirement routes to human review, never automatic rejection", () => {
  const match = computeMatchScore(
    {
      experienceYears: 1,
      experience: [{ title: "Frontend Engineer" }],
      candidateSkills: [
        {
          name: "React.js",
          normalizedName: "reactjs",
          verificationStatus: "VERIFIED",
          isVisible: true,
          validUntil: null,
        },
      ],
    },
    baseJob,
  );
  const screening = evaluateCandidateScreening(match);
  assert.equal(screening.disposition, "HUMAN_REVIEW_REQUIRED");
  assert.equal(screening.automaticRejectionAllowed, false);
  assert.equal(screening.humanReviewRequired, true);
});

test("managed sourcing keeps both HireGo database and inbound application channels explicit", () => {
  const sourceCandidates = fs.readFileSync(
    new URL(
      "../app/api/employer/jobs/[id]/source-candidates/route.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const sourceTracking = fs.readFileSync(
    new URL("../app/api/employer/source-tracking/route.ts", import.meta.url),
    "utf8",
  );
  const matchingEngine = fs.readFileSync(
    new URL("../lib/matching/JobMatchingEngine.ts", import.meta.url),
    "utf8",
  );
  const sourcingDecision = fs.readFileSync(
    new URL(
      "../app/api/candidate/sourcing-invitations/[id]/decision/route.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(sourceCandidates, /HIREGO_TALENT_POOL/);
  assert.match(sourceCandidates, /EVIDENCE_FIRST_NO_AUTO_REJECT/);
  assert.match(sourceCandidates, /evaluateCandidateScreening/);
  assert.match(sourceTracking, /HireGo Talent Pool/);
  assert.match(sourceTracking, /Inbound Application/);
  assert.match(sourcingDecision, /handleApplicationValidationIntent/);
  assert.match(sourcingDecision, /handleApplicationSubmission/);
  assert.match(sourcingDecision, /UNIVERSAL_SKILL_VALIDATION/);
  assert.doesNotMatch(
    sourcingDecision,
    /create:\s*\{\s*candidateProfileId:[\s\S]*status:\s*["']APPLIED["']/,
  );

  assert.doesNotMatch(
    matchingEngine,
    /matchScore\s*[<>]=?\s*config\.autoArchiveScore/,
  );
  assert.doesNotMatch(matchingEngine, /status:\s*["']REJECTED["']/);
});


test("generic managed pipeline cannot directly reject and the controlled endpoint requires human approval", () => {
  const stageRoute = fs.readFileSync(
    new URL(
      "../app/api/employer/candidates/[id]/stage/route.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const decisionRoute = fs.readFileSync(
    new URL(
      "../app/api/employer/candidates/[id]/decision/route.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const tracker = fs.readFileSync(
    new URL(
      "../app/employer/managed-hiring/candidate-tracking/page.tsx",
      import.meta.url,
    ),
    "utf8",
  );

  assert.doesNotMatch(
    stageRoute,
    /z\.enum\(\[[^\]]*["']REJECTED["']/,
  );
  assert.match(stageRoute, /controlled candidate-decision workflow for rejection/i);

  for (const token of [
    "CANDIDATE_REJECTION",
    "requestConsequentialAction",
    "confirmApproval",
    "decideApproval",
    "consumeApprovedActionInTransaction",
    'data: { status: "REJECTED" }',
  ]) {
    assert.ok(
      decisionRoute.includes(token),
      `controlled rejection guard missing: ${token}`,
    );
  }

  assert.match(
    decisionRoute,
    /Required candidate evidence is still pending/,
  );
  assert.match(tracker, /Start controlled rejection/);
  assert.match(tracker, /Request human approval/);
  assert.match(tracker, /Confirm rejection/);
  const movableBlock =
    tracker.match(/const movableStages = \\[([\\s\\S]*?)\\];/)?.[1] ?? "";
  assert.doesNotMatch(movableBlock, /REJECTED/);
});
