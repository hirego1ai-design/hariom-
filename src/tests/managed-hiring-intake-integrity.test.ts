import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function read(relative: string) {
  return fs.readFileSync(path.resolve(process.cwd(), relative), "utf8");
}

test("managed hiring requirement intake rejects missing authoritative business data instead of fabricating defaults", () => {
  const route = read("src/app/api/agreements/requirements/route.ts");
  const wizard = read("src/app/employer/managed-hiring/request/page.tsx");

  assert.match(route, /readValidatedJson/);
  assert.match(route, /Both minimum and maximum salary\/budget are required/);
  assert.match(route, /At least one job title is required/);

  for (const fabricatedDefault of [
    '["Software Engineer"]',
    '"Information Technology"',
    '"Bachelor\'s Degree"',
    'body.workMode || "Hybrid"',
    'body.location || "Remote"',
    'body.experienceYears || "0-3 Years"',
  ]) {
    assert.ok(
      !route.includes(fabricatedDefault),
      `requirement route still contains fabricated fallback: ${fabricatedDefault}`,
    );
  }

  assert.match(wizard, /positions: positions\.map/);
  assert.doesNotMatch(wizard, /experienceYears:\s*"3-5 Years"/);
  assert.doesNotMatch(wizard, /workMode:\s*"Hybrid"/);
});

test("managed hiring requirement details are persisted rather than dropped after submission", () => {
  const schema = read("prisma/schema.prisma");
  const repository = read("src/lib/agreements-db.ts");
  const migration = read(
    "prisma/migrations/20260926123000_managed_hiring_requirement_integrity/migration.sql",
  );

  for (const field of [
    "preferredSkills",
    "department",
    "employmentType",
    "positions",
    "noticePeriod",
    "benefits",
    "gstin",
    "billingAddress",
    "jdFileName",
  ]) {
    assert.ok(schema.includes(field), `Prisma requirement field missing: ${field}`);
    assert.ok(repository.includes(field), `repository persistence field missing: ${field}`);
    assert.ok(migration.includes(`"${field}"`), `migration field missing: ${field}`);
  }

  assert.match(repository, /currency: payload\.currency/);
  assert.match(repository, /workMode: payload\.workMode/);
  assert.match(repository, /hiringPriority: payload\.hiringPriority/);
  assert.match(repository, /replacementExpectation: payload\.replacementExpectation/);
  assert.doesNotMatch(repository, /workMode: payload\.workMode \|\| "Hybrid"/);
});

test("requirement state updates are bounded and cannot claim agreement states without matching agreement evidence", () => {
  const route = read("src/app/api/agreements/requirements/[id]/route.ts");
  assert.match(route, /requirementUpdateSchema/);
  assert.match(route, /SENT_TO_EMPLOYER/);
  assert.match(route, /linked agreement is signed and active/);
  assert.match(route, /activeAgreementId must reference an agreement linked to this requirement and company/);
});

test("commercial agreement creation uses selected template and explicit terms instead of hidden backend defaults", () => {
  const route = read("src/app/api/agreements/contracts/route.ts");
  const repository = read("src/lib/agreements-db.ts");
  const builder = read(
    "src/app/admin/managed-hiring/agreements/builder/page.tsx",
  );

  assert.match(route, /agreementTemplate\.findUnique/);
  assert.match(route, /body\.feeValue \?\? template\.feeValue/);
  assert.match(route, /body\.creditDays \?\? template\.creditTermsDays/);
  assert.match(route, /invoiceRule !== "DAY_25"/);
  assert.match(route, /session\.name \|\| session\.email/);
  assert.doesNotMatch(route, /Number\(body\.feeValue\) \|\| 8\.33/);
  assert.doesNotMatch(route, /body\.invoiceRule \|\| "DAY_25"/);

  assert.match(repository, /creditDays: payload\.creditDays \?\? 0/);
  assert.match(repository, /taxRatePct: payload\.taxRatePct \?\? 0/);
  assert.match(repository, /"CREATED", performedBy/);

  assert.match(builder, /companyId: requirement\?\.companyId/);
  assert.doesNotMatch(builder, /performedBy:\s*"Sales Admin"/);
});

test("admin managed-hiring pipeline draft-agreement control navigates to the real builder", () => {
  const pipeline = read("src/app/admin/managed-hiring/pipeline/page.tsx");
  assert.match(pipeline, /import Link from "next\/link"/);
  assert.match(
    pipeline,
    /\/admin\/managed-hiring\/agreements\/builder\?reqId=/,
  );
});
