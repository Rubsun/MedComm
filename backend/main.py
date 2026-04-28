from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import settings, BASE_DIR
from backend.routers.auth import router as auth_router
from backend.routers.programs import router as programs_router
from backend.routers.courses import router as courses_router
from backend.routers.modules import router as modules_router
from backend.routers.lessons import router as lessons_router
from backend.routers.media import router as media_router
from backend.routers.progress import router as progress_router
from backend.routers.analytics import router as analytics_router
from backend.routers.students import router as students_router
from backend.routers.achievements import router as achievements_router

app = FastAPI(title="Доктор, поговорим? API")

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

app.include_router(auth_router)
app.include_router(programs_router)
app.include_router(courses_router)
app.include_router(modules_router)
app.include_router(lessons_router)
app.include_router(media_router)
app.include_router(progress_router)
app.include_router(analytics_router)
app.include_router(students_router)
app.include_router(achievements_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
