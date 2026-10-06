# HireGo Voice Engine

Self-hosted speech runtime for Candidate Jarvis and, after separate E2E validation, other HireGo voice surfaces.

## Runtime
- STT: faster-whisper `small`, CPU/int8 by default.
- TTS: IndicVoice-82M, with English and Hindi pipelines.
- No paid speech API is required.
- Every inference endpoint requires `HIREGO_VOICE_ENGINE_TOKEN`.
- Audio and TTS payload sizes are bounded and concurrency is capped.

IndicVoice and indic-g2p are pinned to reviewed Git commits and are Apache-2.0 licensed. Model/data provenance must still be reviewed before changing the pinned model or enabling a new voice in production.

## Required production environment
```
ENVIRONMENT=production
HIREGO_VOICE_ENGINE_TOKEN=<32+ char secret>
VOICE_STT_MODEL=small
VOICE_STT_DEVICE=cpu
VOICE_STT_COMPUTE_TYPE=int8
VOICE_TTS_REPO=Bindkushal/IndicVoice-82M
VOICE_TTS_DEVICE=cpu
VOICE_MAX_AUDIO_BYTES=8388608
VOICE_MAX_SECONDS=120
VOICE_MAX_TTS_CHARS=2000
VOICE_MAX_CONCURRENT=2
VOICE_DEFAULT_VOICE=af_heart
VOICE_ALLOWED_VOICES=af_heart,af_bella,am_adam
```

Expose the Railway service only over HTTPS. The main HireGo app uses the same secret in `HIREGO_VOICE_ENGINE_TOKEN` and the service URL in `HIREGO_VOICE_ENGINE_URL`.

Candidate Jarvis voice remains OFF until `/capabilities`, authenticated STT, authenticated TTS, browser microphone capture, transcript confirmation, and playback all pass E2E.
