import os
import sys
import json
import time
import shutil
import tempfile
import subprocess
import requests
import threading
from urllib.parse import urlparse
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, Header, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel

app = FastAPI(title="HireGo Video Analysis Worker", version="1.0.0")

MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "small")
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
MODEL_DIR = os.getenv("WHISPER_MODEL_DIR", os.path.join(os.path.dirname(__file__), ".model_cache"))
INTERNAL_TOKEN = os.getenv("VIDEO_ANALYSIS_INTERNAL_TOKEN", "dev-internal-token-change-in-prod")
MAX_SECONDS = float(os.getenv("VIDEO_ANALYSIS_MAX_SECONDS", "120.0"))
MAX_DOWNLOAD_BYTES = int(os.getenv("VIDEO_ANALYSIS_MAX_DOWNLOAD_BYTES", str(100 * 1024 * 1024)))
MAX_CONCURRENT_JOBS = int(os.getenv("VIDEO_ANALYSIS_MAX_CONCURRENT_JOBS", "2"))
ENVIRONMENT = os.getenv("ENVIRONMENT", os.getenv("NODE_ENV", "development")).lower()
CALLBACK_ORIGIN = os.getenv("VIDEO_ANALYSIS_CALLBACK_ORIGIN", "").rstrip("/")

if ENVIRONMENT == "production":
    if (not INTERNAL_TOKEN or INTERNAL_TOKEN == "dev-internal-token-change-in-prod" or len(INTERNAL_TOKEN) < 32):
        raise RuntimeError("VIDEO_ANALYSIS_INTERNAL_TOKEN must be a non-placeholder secret of at least 32 characters.")
    if not CALLBACK_ORIGIN or urlparse(CALLBACK_ORIGIN).scheme != "https":
        raise RuntimeError("VIDEO_ANALYSIS_CALLBACK_ORIGIN must be an explicit HTTPS origin in production.")
if MAX_SECONDS != 120.0:
    raise RuntimeError("VIDEO_ANALYSIS_MAX_SECONDS must be exactly 120.")
if MAX_DOWNLOAD_BYTES < 1024 * 1024 or MAX_DOWNLOAD_BYTES > 500 * 1024 * 1024:
    raise RuntimeError("VIDEO_ANALYSIS_MAX_DOWNLOAD_BYTES must be between 1 MiB and 500 MiB.")
if MAX_CONCURRENT_JOBS < 1 or MAX_CONCURRENT_JOBS > 16:
    raise RuntimeError("VIDEO_ANALYSIS_MAX_CONCURRENT_JOBS must be between 1 and 16.")

job_slots = threading.BoundedSemaphore(MAX_CONCURRENT_JOBS)
active_job_ids = set()
active_job_ids_lock = threading.Lock()

whisper_model = None

def get_whisper_model():
    global whisper_model
    if whisper_model is None:
        try:
            from faster_whisper import WhisperModel
            print(f"Loading faster-whisper model '{MODEL_SIZE}' on {DEVICE} ({COMPUTE_TYPE})...")
            os.makedirs(MODEL_DIR, exist_ok=True)
            whisper_model = WhisperModel(
                MODEL_SIZE,
                device=DEVICE,
                compute_type=COMPUTE_TYPE,
                download_root=MODEL_DIR,
            )
            print("Whisper model loaded successfully.")
        except Exception as e:
            print(f"Failed to load Whisper model: {e}", file=sys.stderr)
            whisper_model = None
    return whisper_model

class AnalyzeRequest(BaseModel):
    jobId: str
    videoResumeId: str
    fileId: str
    objectKey: str
    claimedDurationSeconds: int
    callbackUrl: str
    claimToken: str
    downloadUrl: Optional[str] = None

@app.get("/health")
def health_check():
    face_task_exists = os.path.exists(os.path.join(MODEL_DIR, "face_landmarker.task"))
    pose_task_exists = os.path.exists(os.path.join(MODEL_DIR, "pose_landmarker.task"))
    return {
        "status": "healthy",
        "whisperModel": MODEL_SIZE,
        "device": DEVICE,
        "computeType": COMPUTE_TYPE,
        "maxAllowedSeconds": MAX_SECONDS,
        "whisperLoaded": whisper_model is not None,
        "faceLandmarkerTaskExists": face_task_exists,
        "poseLandmarkerTaskExists": pose_task_exists,
    }

def verify_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    expected = f"Bearer {INTERNAL_TOKEN}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/analyze")
def analyze_video(
    req: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    auth: None = Depends(verify_token)
):
    validate_callback_url(req.callbackUrl)
    if req.claimedDurationSeconds < 1 or req.claimedDurationSeconds > MAX_SECONDS:
        raise HTTPException(status_code=400, detail="Claimed duration is outside the allowed range")
    with active_job_ids_lock:
        if req.jobId in active_job_ids:
            return {"status": "ACCEPTED", "jobId": req.jobId, "duplicate": True}
        if not job_slots.acquire(blocking=False):
            raise HTTPException(status_code=503, detail="Video analysis worker is at capacity")
        active_job_ids.add(req.jobId)
    background_tasks.add_task(run_claimed_job, req)
    return {"status": "ACCEPTED", "jobId": req.jobId}

def validate_callback_url(callback_url: str):
    parsed = urlparse(callback_url)
    if parsed.scheme not in {"http", "https"} or parsed.username or parsed.password:
        raise HTTPException(status_code=400, detail="Invalid callback URL")
    if parsed.path not in {"/api/internal/video-analysis/callback", "/api/internal/recorded-assessment-analysis/callback"}:
        raise HTTPException(status_code=400, detail="Invalid callback path")
    if ENVIRONMENT == "production" and not callback_url.startswith(f"{CALLBACK_ORIGIN}/"):
        raise HTTPException(status_code=400, detail="Callback origin is not allowed")

def run_claimed_job(req: AnalyzeRequest):
    try:
        process_job(req)
    finally:
        with active_job_ids_lock:
            active_job_ids.discard(req.jobId)
        job_slots.release()

def process_job(req: AnalyzeRequest):
    work_dir = tempfile.mkdtemp(prefix="video_analysis_")
    video_path = os.path.join(work_dir, "input_media")
    audio_path = os.path.join(work_dir, "extracted_audio.wav")

    try:
        # Step 1: Secure Media Retrieval
        if req.downloadUrl:
            r = requests.get(req.downloadUrl, stream=True, timeout=60)
            r.raise_for_status() # Fixed bug: raise_for_status() instead of raise_for_error()
            content_length = int(r.headers.get("content-length", "0") or "0")
            if content_length > MAX_DOWNLOAD_BYTES:
                raise ValueError("Media download exceeds configured size limit")
            downloaded_bytes = 0
            with open(video_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    downloaded_bytes += len(chunk)
                    if downloaded_bytes > MAX_DOWNLOAD_BYTES:
                        raise ValueError("Media download exceeds configured size limit")
                    f.write(chunk)
        else:
            dev_storage_path = os.path.abspath(
                os.path.join(os.getcwd(), "..", ".data", "private-uploads", req.objectKey)
            )
            if os.path.exists(dev_storage_path):
                shutil.copyfile(dev_storage_path, video_path)
            else:
                send_callback(
                    req.callbackUrl, req.jobId, req.videoResumeId, "BLOCKED_INFRA",
                    f"Media storage target unavailable: {req.objectKey}",
                    claim_token=req.claimToken
                )
                return

        # Step 2: Validate actual media duration with ffprobe
        probe_cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            video_path
        ]
        res = subprocess.run(probe_cmd, capture_output=True, text=True, timeout=15)
        if res.returncode != 0:
            send_callback(
                req.callbackUrl, req.jobId, req.videoResumeId, "FAILED",
                f"Corrupt or unsupported media file: {res.stderr}",
                claim_token=req.claimToken
            )
            return

        try:
            actual_duration = float(res.stdout.strip())
        except ValueError:
            send_callback(
                req.callbackUrl, req.jobId, req.videoResumeId, "FAILED",
                "Malformed duration metadata in media container",
                claim_token=req.claimToken
            )
            return

        if actual_duration > MAX_SECONDS + 1.0:
            send_callback(
                req.callbackUrl, req.jobId, req.videoResumeId, "FAILED",
                f"Actual media duration ({actual_duration:.1f}s) exceeds strict maximum allowed limit of {int(MAX_SECONDS)}s.",
                claim_token=req.claimToken
            )
            return

        # Step 3: Extract 16kHz mono audio via ffmpeg
        ffmpeg_cmd = [
            "ffmpeg", "-y", "-i", video_path,
            "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
            audio_path
        ]
        ffmpeg_res = subprocess.run(ffmpeg_cmd, capture_output=True, text=True, timeout=max(45, int(min(MAX_SECONDS, actual_duration) * 1.5)))
        if ffmpeg_res.returncode != 0:
            send_callback(
                req.callbackUrl, req.jobId, req.videoResumeId, "FAILED",
                f"Audio extraction failed: {ffmpeg_res.stderr}",
                claim_token=req.claimToken
            )
            return

        # Step 4: Local Whisper Transcription
        model = get_whisper_model()
        if model is None:
            send_callback(
                req.callbackUrl, req.jobId, req.videoResumeId, "BLOCKED_INFRA",
                "Whisper speech recognition model unavailable on worker",
                claim_token=req.claimToken
            )
            return

        segments, info = model.transcribe(audio_path, beam_size=5, vad_filter=True)
        detected_lang = info.language
        segment_texts = []
        total_prob = 0.0
        seg_count = 0
        words_count = 0
        fillers_count = 0

        filler_words = {"um", "uh", "like", "you know", "hmmm", "ah", "er"}
        for seg in segments:
            segment_texts.append(seg.text.strip())
            total_prob += getattr(seg, 'avg_logprob', -0.2)
            seg_count += 1
            for word in seg.text.lower().split():
                words_count += 1
                clean_w = word.strip(".,!?")
                if clean_w in filler_words:
                    fillers_count += 1

        transcript_text = " ".join(segment_texts)
        if seg_count == 0 or len(transcript_text.strip()) == 0:
            send_callback(
                req.callbackUrl, req.jobId, req.videoResumeId, "FAILED",
                "No audible speech or transcript extracted from audio stream",
                claim_token=req.claimToken
            )
            return

        confidence_avg = max(0.4, min(0.99, 1.0 + (total_prob / seg_count) / 2.0))

        # Step 5: Transcription metrics. Do not infer personality, confidence,
        # professionalism or job suitability from appearance or speech style.
        # Frame and pose analysis is intentionally omitted.
        duration_mins = max(0.1, actual_duration / 60.0)
        wpm = round(words_count / duration_mins, 1)
        pause_ratio = round(max(0.0, min(0.5, 1.0 - (words_count / (duration_mins * 150)))), 2)
        improvements = ["The transcript may be inaccurate. Review the recording directly."] if confidence_avg < 0.65 else []

        result_payload = {
            "transcript": transcript_text,
            "detectedLanguage": detected_lang,
            "wordsPerMinute": wpm,
            "pauseRatio": pause_ratio,
            "fillerWordCount": fillers_count,
            "transcriptConfidence": round(confidence_avg, 2),
            "lowConfidence": confidence_avg < 0.65,
            "audioQuality": "16kHz mono audio stream",
            "facePresenceRatio": None,
            "cameraFacingRatioEstimate": None,
            "headPoseIndicators": None,
            "postureIndicators": None,
            "communicationScore": None,
            "clarityScore": None,
            "confidenceScore": None,
            "professionalism": None,
            "speechDeliveryScore": None,
            "contentStructureScore": None,
            "strengths": [],
            "improvementSuggestions": improvements,
            "actualDurationSeconds": round(actual_duration, 1),
        }

        send_callback(
            req.callbackUrl, req.jobId, req.videoResumeId, "COMPLETED", None,
            result=result_payload,
            model_name=f"whisper-{MODEL_SIZE}",
            model_version="1.0.0",
            worker_version="1.0.0",
            analysis_version="v1",
            claim_token=req.claimToken
        )

    except Exception as e:
        print(f"Job processing exception: {e}", file=sys.stderr)
        send_callback(req.callbackUrl, req.jobId, req.videoResumeId, "FAILED", str(e), claim_token=req.claimToken)
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)

def send_callback(callback_url: str, job_id: str, video_resume_id: str, status: str, error: Optional[str] = None, result: Optional[Dict[str, Any]] = None, **kwargs):
    payload = {
        "jobId": job_id,
        "videoResumeId": video_resume_id,
        "claimToken": kwargs.get("claim_token"),
        "status": status,
        "error": error,
        "result": result,
        "modelName": kwargs.get("model_name", f"whisper-{MODEL_SIZE}"),
        "modelVersion": kwargs.get("model_version", "1.0.0"),
        "workerVersion": kwargs.get("worker_version", "1.0.0"),
        "analysisVersion": kwargs.get("analysis_version", "v1"),
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {INTERNAL_TOKEN}",
    }
    # The application callback is terminal and idempotent. Retry only network,
    # throttling, and server failures; a deterministic 4xx requires operator
    # correction and must not be hammered repeatedly.
    for attempt in range(1, 4):
        try:
            r = requests.post(callback_url, json=payload, headers=headers, timeout=15)
            if r.ok:
                print(f"Callback accepted for job {job_id} -> Status {r.status_code}")
                return True
            if r.status_code not in {408, 425, 429} and r.status_code < 500:
                print(f"Callback rejected for job {job_id} -> Status {r.status_code}", file=sys.stderr)
                return False
        except requests.RequestException as exc:
            if attempt == 3:
                print(f"Callback delivery failed for job {job_id}: {type(exc).__name__}", file=sys.stderr)
                return False
        if attempt < 3:
            time.sleep(min(4, 2 ** (attempt - 1)))
    print(f"Callback delivery exhausted retries for job {job_id}", file=sys.stderr)
    return False

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
