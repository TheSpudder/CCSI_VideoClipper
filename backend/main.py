import os
import subprocess
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

app = FastAPI(title="CCSI Video API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_model: WhisperModel | None = None
MODEL_SIZE = os.environ.get("WHISPER_MODEL", "base")


def get_model() -> WhisperModel:
    global _model
    if _model is None:
        _model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
    return _model


def extract_audio(video_path: Path, audio_path: Path) -> None:
    result = subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(video_path),
            "-vn",
            "-acodec",
            "pcm_s16le",
            "-ar",
            "16000",
            "-ac",
            "1",
            str(audio_path),
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        detail = result.stderr.strip() or "ffmpeg failed to extract audio"
        raise HTTPException(status_code=400, detail=detail)


@app.get("/api/health")
def health():
    ffmpeg_ok = False
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        ffmpeg_ok = result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass

    return {
        "status": "ok",
        "ffmpeg": ffmpeg_ok,
        "model": MODEL_SIZE,
        "model_loaded": _model is not None,
        "segments_supported": True,
    }


@app.post("/api/transcribe")
async def transcribe(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    suffix = Path(file.filename).suffix or ".mp4"

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        video_path = tmp / f"input{suffix}"
        audio_path = tmp / "audio.wav"

        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file")

        video_path.write_bytes(content)

        try:
            extract_audio(video_path, audio_path)
        except HTTPException:
            raise
        except FileNotFoundError:
            raise HTTPException(
                status_code=500,
                detail="ffmpeg not found. Install ffmpeg and add it to your PATH.",
            )

        model = get_model()
        segments_iter, info = model.transcribe(str(audio_path))
        segments_list = list(segments_iter)
        transcript = " ".join(seg.text.strip() for seg in segments_list)
        duration = (
            segments_list[-1].end
            if segments_list
            else getattr(info, "duration", 0.0) or 0.0
        )

        return {
            "transcript": transcript,
            "language": info.language,
            "duration": duration,
            "segments": [
                {
                    "start": seg.start,
                    "end": seg.end,
                    "text": seg.text.strip(),
                }
                for seg in segments_list
            ],
        }
