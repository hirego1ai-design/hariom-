# Local Video Analysis Setup Guide

This guide describes how to run the HireGo 3.0 privacy-first video analysis worker locally on Windows or Linux.

## Prerequisites

1. **Python 3.11** installed and available on PATH.
2. **ffmpeg & ffprobe** installed and added to your system PATH:
   - On Windows: Download static build from [ffmpeg.org](https://ffmpeg.org/download.html) or `winget install Gyan.FFmpeg`.
   - Verify with: `ffmpeg -version` and `ffprobe -version`.
3. Node.js 20+ for the main Next.js app.

## Quick Start (Local Development)

### 1. Set Up the Python Worker

```bash
cd video-analysis-worker

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Add to your local `.env`:

```ini
VIDEO_ANALYSIS_ENABLED=true
VIDEO_ANALYSIS_WORKER_URL=http://localhost:8000
VIDEO_ANALYSIS_INTERNAL_TOKEN=dev-internal-token-change-in-prod
VIDEO_ANALYSIS_MAX_SECONDS=120

WHISPER_MODEL_SIZE=small
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8
```

### 3. Run the Worker

```bash
cd video-analysis-worker
python main.py
```

The worker will start on `http://localhost:8000`. You can check readiness at `http://localhost:8000/health`.

### 4. Run the Next.js App

```bash
npm run dev
```

Record or upload a 2-minute candidate video at `/onboarding/video-resume`. The video will be saved privately, sent to the local Python worker, transcribed with local Whisper (`small`), landmarks extracted via MediaPipe, and displayed in the candidate portal.
