from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import tempfile

try:
    import whisper
except ImportError as error:
    whisper = None
    print("ERROR: não foi possível importar a biblioteca whisper.")
    print(error)
    print("Instale whisper, torch e certifique-se de que ffmpeg esteja disponível no PATH.")

try:
    import imageio_ffmpeg
except ImportError:
    imageio_ffmpeg = None

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = os.environ.get("WHISPER_MODEL", "small")
DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")


def ensure_ffmpeg_available():
    ffmpeg_path = shutil.which("ffmpeg") or shutil.which("ffmpeg.exe")
    if ffmpeg_path:
        return ffmpeg_path

    if imageio_ffmpeg is not None:
        try:
            ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
            if ffmpeg_path and os.path.exists(ffmpeg_path):
                ffmpeg_dir = os.path.dirname(ffmpeg_path)
                os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
                os.environ["FFMPEG_BINARY"] = ffmpeg_path
                return ffmpeg_path
        except Exception as error:
            print("Não foi possível localizar ffmpeg via imageio-ffmpeg:", error)

    return None


ffmpeg_path = ensure_ffmpeg_available()
if whisper is not None and ffmpeg_path is not None:
    print(f"Carregando modelo de transcrição: {MODEL_NAME} em {DEVICE} usando {ffmpeg_path}")
    model = whisper.load_model(MODEL_NAME, device=DEVICE)
else:
    print("Servidor de transcrição iniciado, mas whisper ou ffmpeg não estão disponíveis.")
    model = None

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[1] or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp_path = tmp.name
        tmp.write(await file.read())

    if model is None:
        raise HTTPException(
            status_code=500,
            detail=(
                "Servidor de transcrição local não inicializado. "
                "Instale openai-whisper, torch e ffmpeg, ou rode o servidor após corrigir o PATH."
            ),
        )

    try:
        result = model.transcribe(tmp_path, language="pt")
        text = result.get("text", "")
        duration = result.get("duration", 0)
        return {"text": text, "duration": duration}
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Erro na transcrição local: {error}")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
