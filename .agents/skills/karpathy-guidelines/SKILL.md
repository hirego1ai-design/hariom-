---
name: karpathy-guidelines
description: Engineering discipline for writing, reviewing, debugging, and refactoring HireGo AI code with fewer assumptions, simpler implementations, surgical diffs, and verifiable completion criteria.
license: MIT-derived guidance; upstream attribution below
---

# Karpathy Guidelines — HireGo AI adaptation

Use this skill for any non-trivial coding, bug-fix, review, refactor, security, database, payments, or production-readiness task.

Upstream inspiration: multica-ai/andrej-karpathy-skills (MIT), based on Andrej Karpathy's observations about common LLM coding failure modes.

## 1. Verify before coding

- Inspect the relevant code, tests, schema, routes, and existing patterns before changing anything.
- Do not silently guess missing requirements, APIs, table fields, environment variables, or business rules.
- When ambiguity materially changes the implementation, surface it before committing to one interpretation.
- Prefer evidence from the repository over assumptions.

## 2. Keep the solution minimal

- Implement only what the task requires.
- Reuse existing abstractions and patterns before creating new ones.
- Do not add speculative flexibility, duplicate services, duplicate screens, or unnecessary dependencies.
- Choose the smallest production-safe change that fully solves the problem.

## 3. Make surgical changes

- Every changed line must be explainable by the requested task.
- Do not refactor unrelated code, formatting, comments, or naming while fixing something else.
- Preserve working behavior outside the requested scope.
- Clean up only imports, variables, functions, files, or tests made obsolete by your own change.

## 4. Define success and verify it

Before implementation, translate the task into observable success criteria.

For bugs:
- Reproduce or identify the failing path.
- Add or update a regression test when practical.
- Fix the cause, not only the visible symptom.

For features:
- Verify authorization, validation, persistence, error states, loading/empty states, and relevant integrations.
- Run the smallest relevant test set first, then the repository's required quality gates.

Do not declare the task complete until the applicable checks pass.

## HireGo AI production guardrails

- Never introduce production mock, fake, demo, placeholder, or hardcoded business data.
- Do not use client-side storage as authoritative state for profiles, scores, hiring decisions, payments, or security state.
- Preserve server-side authentication, role checks, tenant isolation, input validation, idempotency, and auditability.
- Consequential hiring or financial actions must remain fail-closed and follow existing approval/security controls.
- Do not fabricate AI scores, provider delivery states, payment success, interview/proctoring results, or operational health.
- Do not weaken security controls merely to make a test pass.
- Prefer existing APIs, Prisma models, migrations, services, and components; do not create parallel implementations without a verified need.

## Completion rule

For each task, be able to state:
1. What was wrong or missing.
2. What changed and why.
3. What was deliberately left unchanged.
4. Which checks prove the result.
5. Any remaining blocker that depends on an external provider, secret, infrastructure, or human approval.
