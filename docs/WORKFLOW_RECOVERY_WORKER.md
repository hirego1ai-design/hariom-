# Workflow recovery worker

The application exposes `POST /api/internal/workflows/recover` for scheduled recovery and authenticated `GET` on the same path for health/heartbeat visibility. Both require `Authorization: Bearer <WORKER_RECOVERY_API_KEY>`. Configure a dedicated random secret of at least 32 characters. It grants only this worker operation; the scheduler does not need database, AI, email, or general internal API credentials.

Configure shared Upstash Redis on the app. Missing coordination or missing/invalid worker credentials fail closed in every environment. A Redis lease prevents overlapping scheduler requests; a lease owner alone may publish completion and release its lock. Heartbeats are retained for 24 hours and become unhealthy after three minutes without progress. Failed recovery, missing event consumers, retrying/failed dispatches, timed-out workflows, or exhausted run budgets produce an unhealthy monitoring result.

## Scheduling

For the existing Compose deployment, set `WORKER_RECOVERY_API_KEY` in the secret-managed deployment environment, then enable the optional `workers` profile with `docker compose --profile workers up -d`. The scheduler container runs as a non-root user with a read-only filesystem, no Linux capabilities, and only the recovery key. It calls the app on the private Compose network every 60 seconds after the previous request completes.

For other hosting, schedule an authenticated POST to the HTTPS endpoint approximately once per minute. Read the authenticated GET endpoint from your monitoring system and alert on HTTP 503, missing/stale heartbeat, or `attention`/`failed` state. Do not expose the worker token in URLs or browser code. Repository changes do not create a hosted scheduler automatically.

## Execution bounds and delivery requirements

Each pass scans at most 20 outbox entries, 20 expired budget reservations, and 20 stale workflows. It stops starting more work after a cooperative 40-second budget. The worker lock and outbox lease last 90 seconds; hosting permits 60 seconds per request. Consumer/provider calls must have their own cancellation-aware timeouts below the remaining run budget. The worker never races a still-running paid side effect against a fake timeout result.

Outbox delivery is at least once. A crash after an external side effect but before its completion checkpoint can require replay, so each real consumer must enforce idempotency with the destination provider. Do not claim exactly-once execution. Expired budget holds are conservatively settled at their reserved cost; recovery does not refund potentially spent credit or automatically replay paid work. Stale workflows are moved to FAILED with a transactional dead-letter record only if their state and update timestamp have not changed since the scan.

Recovery registers three production in-app notification consumers at startup:

- APPLICATION_SUBMITTED: confirms receipt to the persisted application's candidate; does not claim an evaluation or selection result.
- JOB_LISTING_CREATED: notifies current company employer/recruiter members. Fan-out is bounded at 100; empty or larger recipient sets fail visibly for operator review instead of silently truncating delivery.
- HIRING_PIPELINE_COMPLETED: notifies the still-authorized initiator only after verifying the persisted tenant-owned workflow is completed. Explicitly advisory, not a hiring decision.

Notification IDs are deterministic UUIDs keyed by event and recipient. Replays cannot duplicate the notification or reset its read state. These consumers perform database writes only, with no external provider calls. Dispatcher completion checkpoints also tolerate replay via an upsert. Unknown event types remain pending and are reported as unhandled rather than marked delivered. Since scanning is oldest-first, unresolved early unhandled events can block later batches; inspect backlog before increasing traffic. Manually reconcile external side effects before retrying failed workflow steps or dead letters.

This worker is separate from SIEM audit delivery and WhatsApp processing. Their schedules and credentials must be configured independently. No external scheduler, deployment, database migration, or live recovery run was performed as part of adding this integration.
