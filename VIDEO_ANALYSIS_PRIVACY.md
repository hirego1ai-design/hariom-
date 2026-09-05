# Video Analysis Privacy & Ethical Compliance Policy

HireGo 3.0 enforces strict privacy rules and bias-mitigation safeguards for candidate video assessments.

## Strict Privacy Guarantees

1. **Zero External AI Transmissions:** Raw video, audio streams, extracted frames, and transcript text are NEVER transmitted to external third-party AI APIs (such as OpenAI, Google Gemini, or Anthropic).
2. **Self-Hosted Processing:** All speech recognition (Whisper `small`) and facial landmarking (Google MediaPipe) execute inside isolated local worker infrastructure owned by HireGo.
3. **Short-Lived Signed URLs:** Storage objects are held in private Cloudflare R2 / S3 buckets and accessed strictly via ephemeral, server-generated signed URLs.

## Prohibited Evaluation Dimensions

The automated video analysis worker is strictly forbidden from scoring, inferring, or reporting on:

- Race, ethnicity, or skin tone
- Gender, age, or appearance
- Physical beauty or attractiveness
- Disabilities or medical conditions
- Accents or regional dialects as negative factors
- Deception, honesty, or truthfulness
- Emotional states as definitive hiring factors

## Permitted Objective Signals

Only job-relevant, observable signals are measured:

- **Speech Pacing:** Words per minute (WPM)
- **Speech Fluency:** Pause frequency and filler word count
- **Framing & Visibility:** Camera-facing ratio estimate & central framing
- **Audio Quality:** Clarity and background noise level

AI analysis outputs serve exclusively as auxiliary insights for human recruiters and are never used as an automated rejection mechanism.
