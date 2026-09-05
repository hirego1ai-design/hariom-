import os
import sys
import json
import time
import shutil
import tempfile
import subprocess
import requests
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
    background_tasks.add_task(process_job, req)
    return {"status": "ACCEPTED", "jobId": req.jobId}

def process_job(req: AnalyzeRequest):
    work_dir = tempfile.mkdtemp(prefix="video_analysis_")
    video_path = os.path.join(work_dir, "input_media")
    audio_path = os.path.join(work_dir, "extracted_audio.wav")

    try:
        # Step 1: Secure Media Retrieval
        if req.downloadUrl:
            r = requests.get(req.downloadUrl, stream=True, timeout=60)
            r.raise_for_status() # Fixed bug: raise_for_status() instead of raise_for_error()
            with open(video_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
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
                    f"Media storage target unavailable: {req.objectKey}"
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
                f"Corrupt or unsupported media file: {res.stderr}"
            )
            return

        try:
            actual_duration = float(res.stdout.strip())
        except ValueError:
            send_callback(
                req.callbackUrl, req.jobId, req.videoResumeId, "FAILED",
                "Malformed duration metadata in media container"
            )
            return

        if actual_duration > MAX_SECONDS + 1.0:
            send_callback(
                req.callbackUrl, req.jobId, req.videoResumeId, "FAILED",
                f"Actual media duration ({actual_duration:.1f}s) exceeds strict maximum allowed limit of {int(MAX_SECONDS)}s."
            )
            return

        # Step 3: Extract 16kHz mono audio via ffmpeg
        ffmpeg_cmd = [
            "ffmpeg", "-y", "-i", video_path,
            "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
            audio_path
        ]
        ffmpeg_res = subprocess.run(ffmpeg_cmd, capture_output=True, text=True, timeout=30)
        if ffmpeg_res.returncode != 0:
            send_callback(
                req.callbackUrl, req.jobId, req.videoResumeId, "FAILED",
                f"Audio extraction failed: {ffmpeg_res.stderr}"
            )
            return

        # Step 4: Local Whisper Transcription
        model = get_whisper_model()
        if model is None:
            send_callback(
                req.callbackUrl, req.jobId, req.videoResumeId, "BLOCKED_INFRA",
                "Whisper speech recognition model unavailable on worker"
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
                "No audible speech or transcript extracted from audio stream"
            )
            return

        confidence_avg = max(0.4, min(0.99, 1.0 + (total_prob / seg_count) / 2.0))

        # Step 5: MediaPipe Tasks APIs Frame Analysis
        face_presence = None
        camera_facing = None
        head_pose = None
        posture_ind = None

        try:
            import cv2
            import mediapipe as mp
            from mediapipe.tasks import python as mp_python
            from mediapipe.tasks.python import vision as mp_vision

            face_task_path = os.path.join(MODEL_DIR, "face_landmarker.task")
            pose_task_path = os.path.join(MODEL_DIR, "pose_landmarker.task")

            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
            frame_sample_step = int(fps / 2) # 2 fps sampling
            total_sampled = 0
            faces_detected_count = 0
            pose_detected_count = 0

            # Initialize MediaPipe Tasks Landmarkers if model tasks present
            face_landmarker = None
            pose_landmarker = None

            if os.path.exists(face_task_path):
                base_options = mp_python.BaseOptions(model_asset_path=face_task_path)
                options = mp_vision.FaceLandmarkerOptions(base_options=base_options, num_faces=2)
                face_landmarker = mp_vision.FaceLandmarker.create_from_options(options)

            if os.path.exists(pose_task_path):
                base_options_pose = mp_python.BaseOptions(model_asset_path=pose_task_path)
                options_pose = mp_vision.PoseLandmarkerOptions(base_options=base_options_pose)
                pose_landmarker = mp_vision.PoseLandmarker.create_from_options(options_pose)

            count = 0
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                if count % frame_sample_step == 0:
                    total_sampled += 1
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

                    if face_landmarker:
                        face_res = face_landmarker.detect(mp_image)
                        if face_res.face_landmarks:
                            faces_detected_count += 1

                    if pose_landmarker:
                        pose_res = pose_landmarker.detect(mp_image)
                        if pose_res.pose_landmarks:
                            pose_detected_count += 1

                count += 1
            cap.release()

            if total_sampled > 0:
                face_presence = round(faces_detected_count / total_sampled, 2)
                camera_facing = round(min(1.0, face_presence * 0.95), 2)
                head_pose = {"facingRatio": camera_facing, "measuredFrames": total_sampled}
                posture_ind = {"uprightRatio": round(pose_detected_count / total_sampled, 2)}

        except Exception as mp_err:
            print(f"MediaPipe Tasks processing warning: {mp_err}")
            # Keep MediaPipe indicators null if frame analysis unavailable; do NOT insert fake 0.95 defaults!

        # Step 6: Objective Signal Aggregation
        duration_mins = max(0.1, actual_duration / 60.0)
        wpm = round(words_count / duration_mins, 1)
        pause_ratio = round(max(0.0, min(0.5, 1.0 - (words_count / (duration_mins * 150)))), 2)

        comm_score = min(100, max(40, int(80 + (wpm - 120) * 0.2 - fillers_count * 2)))
        clarity_score = min(100, max(50, int(confidence_avg * 100)))
        delivery_score = min(100, max(40, int(face_presence * 70 + camera_facing * 30))) if (face_presence is not None and camera_facing is not None) else None
        structure_score = min(100, max(50, int(85 - pause_ratio * 50)))
        confidence_score = min(100, max(40, int((comm_score + (delivery_score or comm_score)) / 2)))
        professionalism = min(100, max(50, int((clarity_score + structure_score) / 2)))

        strengths = []
        improvements = []

        if 110 <= wpm <= 160:
            strengths.append("Optimal speaking pace and clear speech rhythm.")
        elif wpm < 110:
            improvements.append("Speaking rate is slow; consider slight pacing increase.")
        else:
            improvements.append("Fast speaking pace; consider pausing between key points.")

        if fillers_count == 0:
            strengths.append("Fluent speech delivery with minimal filler word usage.")
        else:
            improvements.append(f"Detected {fillers_count} filler words (um/uh/like); practice smooth transitions.")

        if face_presence is not None and face_presence >= 0.8:
            strengths.append("Consistent camera framing and visibility.")
        elif face_presence is not None:
            improvements.append("Ensure consistent central camera framing.")

        result_payload = {
            "transcript": transcript_text,
            "detectedLanguage": detected_lang,
            "wordsPerMinute": wpm,
            "pauseRatio": pause_ratio,
            "fillerWordCount": fillers_count,
            "transcriptConfidence": round(confidence_avg, 2),
            "lowConfidence": confidence_avg < 0.65,
            "audioQuality": "16kHz mono audio stream",
            "facePresenceRatio": face_presence,
            "cameraFacingRatioEstimate": camera_facing,
            "headPoseIndicators": head_pose,
            "postureIndicators": posture_ind,
            "communicationScore": comm_score,
            "clarityScore": clarity_score,
            "confidenceScore": confidence_score,
            "professionalism": professionalism,
            "speechDeliveryScore": delivery_score,
            "contentStructureScore": structure_score,
            "strengths": strengths,
            "improvementSuggestions": improvements,
            "actualDurationSeconds": round(actual_duration, 1),
        }

        send_callback(
            req.callbackUrl, req.jobId, req.videoResumeId, "COMPLETED", None,
            result=result_payload,
            model_name=f"whisper-{MODEL_SIZE}",
            model_version="1.0.0",
            worker_version="1.0.0",
            analysis_version="v1"
        )

    except Exception as e:
        print(f"Job processing exception: {e}", file=sys.stderr)
        send_callback(req.callbackUrl, req.jobId, req.videoResumeId, "FAILED", str(e))
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)

def send_callback(callback_url: str, job_id: str, video_resume_id: str, status: str, error: Optional[str] = None, result: Optional[Dict[str, Any]] = None, **kwargs):
    payload = {
        "jobId": job_id,
        "videoResumeId": video_resume_id,
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
    try:
        r = requests.post(callback_url, json=payload, headers=headers, timeout=15)
        print(f"Callback sent to {callback_url} -> Status {r.status_code}")
    except Exception as e:
        print(f"Failed to post callback to {callback_url}: {e}", file=sys.stderr)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
