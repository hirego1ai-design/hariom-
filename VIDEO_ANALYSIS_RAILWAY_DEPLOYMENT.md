# Railway Deployment Guide for `video-analysis-worker`

This document details the configuration for deploying the `video-analysis-worker` service on Railway.

## Resource Sizing & Costs

### Initial Production Sizing
- **Service Name:** `video-analysis-worker`
- **CPU:** 2 vCPU
- **RAM:** 4 GB
- **Whisper Model:** `small`
- **Device:** `cpu`
- **Compute Type:** `int8`
- **Replicas:** 1 initially

### Cost Controls & Limits
- **Execution Concurrency:** Bounded to 2 concurrent video processing tasks per replica.
- **Estimated Processing Time:** ~15–30 seconds for a 2-minute video on 2 vCPU.
- **Railway Billing:** Charges only for active CPU/RAM usage.

## Step-by-Step Railway Deployment

1. **Create New Service in Railway:**
   - Connect your GitHub repository.
   - Set Root Directory to `/video-analysis-worker`.

2. **Configure Service Environment Variables in Railway:**

```ini
WHISPER_MODEL_SIZE=small
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8
WHISPER_MODEL_DIR=/app/.model_cache
VIDEO_ANALYSIS_INTERNAL_TOKEN=generate-a-secure-random-64-char-hex-token
VIDEO_ANALYSIS_MAX_SECONDS=120
```

3. **Configure Healthcheck Path:**
   - Path: `/health`
   - Timeout: 10s

4. **Update Main Next.js App Environment Variables:**

```ini
VIDEO_ANALYSIS_ENABLED=true
VIDEO_ANALYSIS_WORKER_URL=https://video-analysis-worker.up.railway.app
VIDEO_ANALYSIS_INTERNAL_TOKEN=same-secure-token-as-worker
```
