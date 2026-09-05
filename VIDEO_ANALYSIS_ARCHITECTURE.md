# Video Analysis System Architecture

## Overview

HireGo 3.0 features a local-only, zero-external-AI video resume analysis pipeline. Candidate video files (up to 120 seconds) are stored in private Cloudflare R2 / AWS S3 storage and processed asynchronously by a dedicated CPU worker.

## Data Flow Pipeline

```
Candidate Upload
     │
     ▼
[POST /api/upload] ──► R2 / S3 Private Storage
     │
     ▼
[POST /api/candidate/video-resume]
     │
     ├──► Create VideoResume & VideoAnalysisJob DB records (Status: PENDING)
     │
     └──► Asynchronous POST trigger ──► [video-analysis-worker]
                                                │
                                                ├── 1. ffprobe (Validate duration <= 120s & media signature)
                                                ├── 2. ffmpeg (Extract 16kHz mono WAV)
                                                ├── 3. faster-whisper (Multilingual 'small' model, int8 CPU)
                                                ├── 4. MediaPipe (Face & Pose Landmarker)
                                                └── 5. Score Aggregation (Bias-free, deterministic)
                                                │
                                                ▼
                                         [POST /api/internal/video-analysis/callback]
                                                │
                                                ▼
                                         Update Postgres DB (Status: COMPLETED)
```

## Key Architectural Principles

1. **No External AI Leakage:** No video, audio, frames, or transcripts leave your infrastructure to cloud LLMs (Gemini, OpenAI).
2. **Strict 120-Second Cap:** Media duration is validated server-side by `ffprobe` in the worker, ignoring untrusted client metadata.
3. **Idempotent Queueing:** Every analysis request uses a unique idempotency key (`VideoAnalysisJob`), preventing duplicate report creation upon retries.
