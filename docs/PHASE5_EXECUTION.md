# Phase 5 — Safe Agent & Managed-Hiring Orchestration

Phase 5 follows the repository's existing production-readiness plan. It is not a release-operations phase: the canonical plan defines Phase 5 as **Safe agent and managed-hiring orchestration (G11)**.

## Exit criteria

Phase 5 is complete only when production paths have:

- typed, allowlisted agent actions; no arbitrary route/tool execution;
- server-derived actor, tenant and authorization context;
- explicit human approval for consequential hiring, financial, communication and destructive actions;
- per-company/per-user rate limits and bounded AI spend/budget controls;
- idempotency keys and durable execution records for side-effecting actions;
- replay/concurrency protection and deterministic terminal states;
- visible truthful execution status, including failure and pending-approval states;
- audit/security events for approvals and consequential execution;
- provider/database failure behavior that does not fabricate success;
- automated authorization, cross-tenant, replay, concurrency and failure regressions;
- staging evidence before any live activation.

## Safety invariants

An AI recommendation is not authorization. Agent output cannot directly select/reject a candidate, send an external message, create a charge/invoice, mutate approved commercial terms, or delete protected data unless the specific action is authorized by policy and any required human approval is persisted.

No Phase 5 change may weaken the production payment blocks, upload quarantine, tenant isolation, test-safety guards, or audit controls completed in earlier phases.

## Execution order

1. Inventory all agent/managed-hiring entry points and side effects.
2. Centralize typed action policy and tenant/role authorization.
3. Add approval boundaries for consequential actions.
4. Verify durable idempotency, replay and concurrency behavior.
5. Enforce spend/rate limits and bounded inputs/outputs.
6. Make execution state truthful in employer/admin UI.
7. Add negative-path and cross-tenant regression coverage.
8. Run full CI/security gates and staging checklist.

## External evidence

Repository tests/builds are not staging certification. Provider credentials, deployed worker/scheduler heartbeat, real sandbox provider callbacks, and authenticated staging journeys must be recorded separately and must never be simulated in UI or documentation.
