from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os

try:
    import whisper
except ImportError as error:
    whisper = None
    print("ERROR: não foi possível importar a biblioteca whisper.")
    print(error)
    print("Instale whisper, torch e certifique-se de que ffmpeg esteja disponível no PATH.")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = os.environ.get("WHISPER_MODEL", "small")
DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")

if whisper is not None:
    print(f"Carregando modelo de transcrição: {MODEL_NAME} em {DEVICE}")
    model = whisper.load_model(MODEL_NAME, device=DEVICE)
else:
    print("Servidor de transcrição iniciado, mas whisper não está disponível.")
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
                "Verifique os logs do servidor e instale whisper / torch corretamente."
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
