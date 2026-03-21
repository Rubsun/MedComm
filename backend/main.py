from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.config import settings, BASE_DIR

app = FastAPI(title="MedComm API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

media_path = BASE_DIR / settings.media_dir
media_path.mkdir(exist_ok=True)
app.mount("/media", StaticFiles(directory=str(media_path)), name="media")

@app.get("/api/health")
async def health():
    return {"status": "ok"}
