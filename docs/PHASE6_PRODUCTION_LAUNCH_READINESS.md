# Phase 6 — Production Launch & Scale Readiness

This is the final production launch gate. Source inspection or a green build alone is not production certification.

## Definition of done

Fresh checkout → install → security audit → Prisma → TypeScript → lint → tests → build → staging migration → authenticated staging E2E → load/failure tests → security verification → deployment/rollback proof → production release approval.

No item is 100% without evidence appropriate to that item. Provider, staging, restore, load, and rollback claims require real execution evidence.

## Authoritative workstreams

1. Production secrets
2. Production database
3. Backup & recovery
4. Redis / rate limiting
5. Authentication
6. Tenant isolation
7. RBAC
8. AI production safety
9. Hiring E2E
10. Video resume/interview
11. WhatsApp
12. Email/notifications
13. Billing
14. File security
15. API security
16. Abuse protection
17. Observability
18. Alerting
19. Reliability
20. Performance
21. Load testing
22. Failure testing
23. Frontend/UI/UX
24. Accessibility
25. Dependency security
26. Automated verification
27. Production build
28. Staging
29. Deployment safety
30. Incident readiness
31. Final security audit
32. Launch evidence
33. Final release gate

## Evidence states

- GREEN: executable CI/staging/provider evidence exists and the requirement passes.
- YELLOW: implementation exists but required live/operational evidence is incomplete.
- RED: a production blocker or failed gate exists.
- NOT VERIFIED: no sufficient evidence yet.

## Safety rules

- Never use production customer data, real charges, or candidate communications as test fixtures.
- Never bypass disposable-database guards.
- Never use development OTP/master codes in staging or production verification.
- Never report fabricated provider success.
- Never weaken tenant, RBAC, approval, payment, quarantine, rate-limit, or audit controls to make a gate pass.
- Database rollback evidence means a tested recovery strategy; do not invent destructive down migrations.

## Final evidence trigger

The repository's `Production Load Test` workflow is intentionally protected from running on every push. It runs only on manual dispatch or when the main-branch commit message contains `[load-test]`.

For the final production-readiness evidence run, merge the dedicated release-gate PR with `[load-test]` in the merge commit message. The workflow performs the existing safe, read-only production load test against `https://www.hiregoai.com` and uploads `load-test-results.json` as retained evidence.

A skipped load-test job is not a pass. Final release sign-off requires an actual successful run plus the normal CI, Phase 5, security, migration, deployment, and provider checks.

