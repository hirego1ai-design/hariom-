# Third-party model/runtime notices

HireGo Voice Engine is designed for self-hosted inference.

- **faster-whisper** is used for speech-to-text.
- **IndicVoice** source is pinned to Git commit `57240e779560e8c3d022836f4191e0db6dff9018`.
- **indic-g2p** source is pinned to Git commit `6bc9ca45fb06955bb19057344ac6a4e400ed4c95`.
- The reviewed IndicVoice and indic-g2p repositories declare Apache License 2.0.
- The configured model repository is `Bindkushal/IndicVoice-82M`, whose published model card declares Apache-2.0.

Do not silently replace the model, voice pack, training-data-derived artifact, or dependency revision. A new model/voice requires a fresh licence/provenance review, security review, benchmark, and Super Admin approval before production enablement.
