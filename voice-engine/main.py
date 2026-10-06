import io
import hmac
import os
import shutil
import subprocess
import tempfile
import threading
from typing import Optional

import numpy as np
import soundfile as sf
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field

app = FastAPI(title="HireGo Voice Engine", version="1.0.0")

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
INTERNAL_TOKEN = os.getenv("HIREGO_VOICE_ENGINE_TOKEN", "")
WHISPER_MODEL = os.getenv("VOICE_STT_MODEL", "small")
WHISPER_DEVICE = os.getenv("VOICE_STT_DEVICE", "cpu")
WHISPER_COMPUTE_TYPE = os.getenv("VOICE_STT_COMPUTE_TYPE", "int8")
MODEL_DIR = os.getenv("VOICE_MODEL_DIR", "/app/.model_cache")
TTS_REPO = os.getenv("VOICE_TTS_REPO", "Bindkushal/IndicVoice-82M")
TTS_DEVICE = os.getenv("VOICE_TTS_DEVICE", "cpu")
MAX_AUDIO_BYTES = int(os.getenv("VOICE_MAX_AUDIO_BYTES", str(8 * 1024 * 1024)))
MAX_SECONDS = float(os.getenv("VOICE_MAX_SECONDS", "120"))
MAX_TTS_CHARS = int(os.getenv("VOICE_MAX_TTS_CHARS", "2000"))
MAX_CONCURRENT = int(os.getenv("VOICE_MAX_CONCURRENT", "2"))
ALLOWED_VOICES = tuple(value.strip() for value in os.getenv("VOICE_ALLOWED_VOICES", "af_heart,af_bella,am_adam").split(",") if value.strip())
DEFAULT_VOICE = os.getenv("VOICE_DEFAULT_VOICE", "af_heart").strip()

if ENVIRONMENT == "production" and (len(INTERNAL_TOKEN) < 32 or "change" in INTERNAL_TOKEN.lower()):
    raise RuntimeError("HIREGO_VOICE_ENGINE_TOKEN must be a non-placeholder secret of at least 32 characters.")
if not (256 * 1024 <= MAX_AUDIO_BYTES <= 15 * 1024 * 1024):
    raise RuntimeError("VOICE_MAX_AUDIO_BYTES must be between 256 KiB and 15 MiB.")
if not (15 <= MAX_SECONDS <= 300):
    raise RuntimeError("VOICE_MAX_SECONDS must be between 15 and 300.")
if not (200 <= MAX_TTS_CHARS <= 4000):
    raise RuntimeError("VOICE_MAX_TTS_CHARS must be between 200 and 4000.")
if not (1 <= MAX_CONCURRENT <= 8):
    raise RuntimeError("VOICE_MAX_CONCURRENT must be between 1 and 8.")
if not ALLOWED_VOICES or DEFAULT_VOICE not in ALLOWED_VOICES:
    raise RuntimeError("VOICE_DEFAULT_VOICE must be included in VOICE_ALLOWED_VOICES.")

slots = threading.BoundedSemaphore(MAX_CONCURRENT)
whisper_model = None
tts_model = None
tts_pipelines = {}
model_lock = threading.Lock()

def verify_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    expected = f"Bearer {INTERNAL_TOKEN}"
    if not hmac.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Invalid token")

def get_whisper():
    global whisper_model
    with model_lock:
        if whisper_model is None:
            from faster_whisper import WhisperModel
            os.makedirs(MODEL_DIR, exist_ok=True)
            whisper_model = WhisperModel(
                WHISPER_MODEL,
                device=WHISPER_DEVICE,
                compute_type=WHISPER_COMPUTE_TYPE,
                download_root=MODEL_DIR,
            )
    return whisper_model

def normalized_language(language: Optional[str]) -> str:
    raw = (language or "en").lower().replace("_", "-")
    return "hi" if raw.startswith("hi") else "a"

def get_tts_pipeline(language: Optional[str]):
    global tts_model
    lang = normalized_language(language)
    with model_lock:
        if lang in tts_pipelines:
            return tts_pipelines[lang]
        from indicvoice import IndicModel, IndicPipeline
        if tts_model is None:
            tts_model = IndicModel(repo_id=TTS_REPO).to(TTS_DEVICE).eval()
        pipeline = IndicPipeline(lang_code=lang, repo_id=TTS_REPO, model=tts_model, device=TTS_DEVICE)
        tts_pipelines[lang] = pipeline
        return pipeline

@app.get("/health")
def health():
    return {"status": "healthy", "workerVersion": "1.0.0", "service": "hirego-voice-engine"}

@app.get("/capabilities")
def capabilities(auth: None = Depends(verify_token)):
    try:
        stt_ready = get_whisper() is not None
        tts_ready = get_tts_pipeline("en") is not None
    except Exception:
        stt_ready = False
        tts_ready = False
    if not stt_ready or not tts_ready:
        raise HTTPException(status_code=503, detail="Voice models are not ready")
    return {
        "status": "ready",
        "workerVersion": "1.0.0",
        "stt": {"ready": True, "provider": "hirego-self-hosted", "model": f"faster-whisper-{WHISPER_MODEL}"},
        "tts": {"ready": True, "provider": "hirego-self-hosted", "model": "IndicVoice-82M"},
        "languages": ["en", "hi"],
        "voices": list(ALLOWED_VOICES),
    }

class TtsRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    voiceKey: str = Field(min_length=1, max_length=80)
    language: str = Field(min_length=2, max_length=16)

@app.post("/v1/stt")
async def speech_to_text(
    audio: UploadFile = File(...),
    expectedLanguage: Optional[str] = Form(None),
    auth: None = Depends(verify_token),
):
    allowed_types = {"audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav", "audio/x-wav", "video/webm"}
    content_type = (audio.content_type or "").split(";")[0].strip().lower()
    if content_type not in allowed_types:
        raise HTTPException(status_code=415, detail="Unsupported audio type")
    if not slots.acquire(blocking=False):
        raise HTTPException(status_code=503, detail="Voice engine is at capacity")

    work_dir = tempfile.mkdtemp(prefix="hirego_voice_")
    source_path = os.path.join(work_dir, "input")
    wav_path = os.path.join(work_dir, "audio.wav")
    try:
        total = 0
        with open(source_path, "wb") as target:
            while True:
                chunk = await audio.read(64 * 1024)
                if not chunk:
                    break
                total += len(chunk)
                if total > MAX_AUDIO_BYTES:
                    raise HTTPException(status_code=413, detail="Audio exceeds size limit")
                target.write(chunk)
        if total < 128:
            raise HTTPException(status_code=400, detail="Audio is empty")

        probe = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", source_path],
            capture_output=True, text=True, timeout=15,
        )
        if probe.returncode != 0:
            raise HTTPException(status_code=400, detail="Audio is corrupt or unsupported")
        try:
            duration = float(probe.stdout.strip())
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid audio duration")
        if duration < 0.2 or duration > MAX_SECONDS + 1:
            raise HTTPException(status_code=413, detail="Audio duration is outside the allowed range")

        converted = subprocess.run(
            ["ffmpeg", "-y", "-i", source_path, "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", wav_path],
            capture_output=True, text=True, timeout=max(30, int(duration * 1.5)),
        )
        if converted.returncode != 0:
            raise HTTPException(status_code=400, detail="Audio conversion failed")

        model = get_whisper()
        hint = (expectedLanguage or "").lower().split("-")[0]
        language = hint if hint in {"en", "hi"} else None
        segments, info = model.transcribe(wav_path, language=language, beam_size=5, vad_filter=True)
        texts = []
        logprob = 0.0
        count = 0
        for segment in segments:
            value = segment.text.strip()
            if value:
                texts.append(value)
            logprob += getattr(segment, "avg_logprob", -0.2)
            count += 1
        transcript = " ".join(texts).strip()
        if not transcript or count == 0:
            raise HTTPException(status_code=422, detail="No audible speech detected")
        confidence = max(0.4, min(0.99, 1.0 + (logprob / count) / 2.0))
        return {
            "transcript": transcript,
            "detectedLanguage": info.language or language or "und",
            "confidence": round(confidence, 3),
            "durationSeconds": round(duration, 2),
            "provider": "hirego-self-hosted",
            "model": f"faster-whisper-{WHISPER_MODEL}",
            "workerVersion": "1.0.0",
        }
    finally:
        try:
            await audio.close()
        except Exception:
            pass
        shutil.rmtree(work_dir, ignore_errors=True)
        slots.release()

@app.post("/v1/tts")
def text_to_speech(body: TtsRequest, auth: None = Depends(verify_token)):
    text = body.text.strip()
    if not text or len(text) > MAX_TTS_CHARS:
        raise HTTPException(status_code=413, detail="TTS text is outside the allowed range")
    if body.voiceKey not in ALLOWED_VOICES:
        raise HTTPException(status_code=400, detail="Voice is not allowlisted")
    if not slots.acquire(blocking=False):
        raise HTTPException(status_code=503, detail="Voice engine is at capacity")
    try:
        pipeline = get_tts_pipeline(body.language)
        audio_chunks = []
        for result in pipeline(text, voice=body.voiceKey, speed=1.0):
            if result.audio is None:
                continue
            audio_chunks.append(result.audio.detach().cpu().numpy())
        if not audio_chunks:
            raise HTTPException(status_code=503, detail="TTS model produced no audio")
        audio = np.concatenate(audio_chunks).astype(np.float32)
        buffer = io.BytesIO()
        sf.write(buffer, audio, 24000, format="WAV", subtype="PCM_16")
        payload = buffer.getvalue()
        if not payload or len(payload) > 8 * 1024 * 1024:
            raise HTTPException(status_code=503, detail="TTS output is invalid")
        return Response(
            content=payload,
            media_type="audio/wav",
            headers={"X-HireGo-Voice-Provider": "hirego-self-hosted", "X-HireGo-Voice-Model": "IndicVoice-82M"},
        )
    finally:
        slots.release()
