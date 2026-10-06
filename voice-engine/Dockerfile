FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    espeak-ng \
    libsndfile1 \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ENV VOICE_STT_MODEL=small
ENV VOICE_STT_DEVICE=cpu
ENV VOICE_STT_COMPUTE_TYPE=int8
ENV VOICE_TTS_DEVICE=cpu
ENV VOICE_MODEL_DIR=/app/.model_cache
ENV VOICE_DEFAULT_VOICE=af_heart
ENV VOICE_ALLOWED_VOICES=af_heart,af_bella,am_adam

COPY main.py .

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
