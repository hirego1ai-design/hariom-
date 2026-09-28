import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("admin recorded assessment screens stay aligned with audited API contracts", () => {
  const questionsPage = fs.readFileSync(
    new URL("../app/admin/recorded-assessment/questions/page.tsx", import.meta.url),
    "utf8",
  );
  const questionsApi = fs.readFileSync(
    new URL("../app/api/admin/recorded-assessment/questions/route.ts", import.meta.url),
    "utf8",
  );
  const retireApi = fs.readFileSync(
    new URL("../app/api/admin/recorded-assessment/questions/[id]/route.ts", import.meta.url),
    "utf8",
  );
  const reviewPage = fs.readFileSync(
    new URL("../app/admin/recorded-assessment/restrictions/page.tsx", import.meta.url),
    "utf8",
  );
  const reviewApi = fs.readFileSync(
    new URL("../app/api/admin/recorded-assessment/restrictions/[id]/route.ts", import.meta.url),
    "utf8",
  );

  assert(questionsApi.includes("requireAdminSession(request)"));
  assert(questionsApi.includes("RECORDED_ASSESSMENT_QUESTION_PUBLISHED"));
  assert(retireApi.includes("expectedUpdatedAt: z.string().datetime()"));
  assert(retireApi.includes("RECORDED_ASSESSMENT_QUESTION_RETIRED"));
  assert(questionsPage.includes("Publication reason"));
  assert(questionsPage.includes("expectedUpdatedAt: retireTarget.updatedAt"));
  assert(questionsPage.includes("Page {page} of {totalPages}"));

  assert(reviewApi.includes("expectedUpdatedAt: z.string().datetime()"));
  assert(reviewApi.includes("enqueueSecurityAuditEvent(tx, auditLog, admin.id)"));
  assert(reviewPage.includes("expectedUpdatedAt: reviewTarget.item.updatedAt"));
  assert(reviewPage.includes("Mandatory review note"));
  assert(!reviewPage.includes("window.prompt"));
});
