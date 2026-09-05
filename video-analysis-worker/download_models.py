import os
import sys
import requests

MODEL_DIR = os.getenv("WHISPER_MODEL_DIR", os.path.join(os.path.dirname(__file__), ".model_cache"))

FACE_LANDMARKER_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
POSE_LANDMARKER_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"

def download_file(url: str, dest_path: str):
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1000:
        print(f"Model file already exists: {dest_path}")
        return
    print(f"Downloading {url} -> {dest_path}...")
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    r = requests.get(url, stream=True, timeout=120)
    r.raise_for_status()
    with open(dest_path, "wb") as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"Downloaded {dest_path} ({os.path.getsize(dest_path)} bytes)")

def download_all():
    os.makedirs(MODEL_DIR, exist_ok=True)
    face_task = os.path.join(MODEL_DIR, "face_landmarker.task")
    pose_task = os.path.join(MODEL_DIR, "pose_landmarker.task")

    try:
        download_file(FACE_LANDMARKER_URL, face_task)
        download_file(POSE_LANDMARKER_URL, pose_task)
    except Exception as e:
        print(f"Warning: Failed to download MediaPipe task models: {e}", file=sys.stderr)

if __name__ == "__main__":
    download_all()
