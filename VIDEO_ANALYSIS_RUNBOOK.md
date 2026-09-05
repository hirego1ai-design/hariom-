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

## Data Retention & Cleanup

A periodic cron job runs to remove expired raw video files according to `VIDEO_ANALYSIS_RETENTION_DAYS` (default 30 days) while preserving the anonymized metrics and transcripts in Postgres.
