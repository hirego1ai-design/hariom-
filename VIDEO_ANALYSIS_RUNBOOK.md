# Video Analysis Operations & Troubleshooting Runbook

## Overview

This runbook covers day-to-day operations, monitoring, troubleshooting, and failure recovery for the `video-analysis-worker`.

## Health Monitoring

Check worker status via the HTTP health endpoint:

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "whisperModel": "small",
  "device": "cpu",
  "computeType": "int8",
  "maxAllowedSeconds": 120.0,
  "modelLoaded": true
}
```

## Common Operational Issues

### 1. `BLOCKED_INFRA` Status on Video Resumes
- **Cause:** `VIDEO_ANALYSIS_ENABLED` is set to `false` or `VIDEO_ANALYSIS_WORKER_URL` is unreachable.
- **Fix:** Verify `VIDEO_ANALYSIS_ENABLED=true` in `.env`, verify `video-analysis-worker` service is running, and test connectivity to `/health`.

### 2. Video Duration Violation Errors
- **Cause:** Candidate uploaded a video longer than 120 seconds.
- **Behavior:** Rejected by API or `ffprobe` in worker with error message.
- **Fix:** Inform candidate to trim video to under 2 minutes.

### 3. MediaPipe Frame Processing Warnings
- **Cause:** Missing system graphics libraries on headless Linux.
- **Fix:** Ensure `opencv-python-headless` is used instead of `opencv-python`, and `libgl1` + `libglib2.0-0` are installed in the Docker image.

## Delivery and recovery limitation

The worker retries an idempotent terminal callback up to three times and limits concurrent jobs per replica. Its FastAPI background task is not a durable queue: a container crash after acceptance can leave the database job in `PROCESSING`. No automated stale-video redispatch worker is currently implemented, because redispatch requires a fresh signed media URL and an operator-approved retry policy. Alert on old `PROCESSING` jobs and reconcile them before retrying. Do not describe this path as exactly-once or fully crash-recoverable.

## Data Retention & Cleanup

`VIDEO_ANALYSIS_RETENTION_DAYS` records the intended policy, but no verified production cleanup worker currently removes expired raw media. Configure a storage lifecycle rule or implement and test a cleanup job before production video retention is considered complete.
