# Security audit delivery

HireGo stores every application audit event and its SIEM delivery envelope in the same database transaction. The request path never calls the SIEM directly.

## Configure

Set `SIEM_WEBHOOK_URL` and `SIEM_WEBHOOK_TOKEN` in the deployment secret manager. Production requires an HTTPS URL without embedded credentials. The receiving SIEM must accept JSON with a bearer token and should deduplicate by `X-HireGo-Audit-Event`. `X-HireGo-Audit-SHA256` is the SHA-256 of the stored event envelope.

## Schedule

Use the platform scheduler to issue an authenticated `POST` every minute to:

`https://<application-host>/api/internal/security-audit/process`

Send the deployment's `INTERNAL_API_KEY` in either `Authorization: Bearer <key>` or `x-api-key`. Do not expose this endpoint to browser clients or add its credential to source control.

Each run leases at most 20 events and sends no more than four deliveries concurrently. A delivery has a five-second timeout. Transient failures (timeouts, 408, 425, 429, and 5xx) use exponential backoff and become terminal after ten attempts. Other 4xx responses are terminal immediately because retrying them cannot repair a malformed or unauthorized SIEM request.

## Operate

Alert on outbox events in `FAILED` state, a growing count of `PENDING` records, or old `PROCESSING` records. A worker crash is recoverable: expired leases become available for a later run. Treat delivery as at-least-once and retain SIEM-side event-ID deduplication.
