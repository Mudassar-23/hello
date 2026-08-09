from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.routers import auth, certifications, contact_messages, content, experience, honors, media, projects, skills
from app.seed import seed_database
from app.uploads_util import ensure_backend_certs_dir, ensure_backend_videos_dir, ensure_upload_dir

settings = get_settings()

docs_url = "/docs" if settings.environment != "production" else None
redoc_url = "/redoc" if settings.environment != "production" else None

app = FastAPI(
    title="Portfolio API",
    docs_url=docs_url,
    redoc_url=redoc_url,
    openapi_url="/openapi.json" if settings.environment != "production" else None,
)

upload_path = ensure_upload_dir()
video_path = ensure_backend_videos_dir()
certs_path = ensure_backend_certs_dir()
app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")
app.mount("/videos", StaticFiles(directory=str(video_path)), name="videos")
app.mount("/certs", StaticFiles(directory=str(certs_path)), name="certs")

app.state.limiter = auth.limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if settings.environment == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )
        return response


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(content.router)
app.include_router(skills.router)
app.include_router(experience.router)
app.include_router(projects.router)
app.include_router(media.router)
app.include_router(certifications.router)
app.include_router(honors.router)
app.include_router(contact_messages.router)


from sqlalchemy import text

@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    # Safe migrations for new columns / tables (no-op if already exist)
    _safe_migrations = [
        "ALTER TABLE projects ADD COLUMN video_path TEXT DEFAULT ''",
    ]
    with engine.connect() as conn:
        for sql in _safe_migrations:
            try:
                conn.execute(text(sql))
                conn.commit()
            except Exception:
                pass

    ensure_upload_dir()
    ensure_backend_videos_dir()
    ensure_backend_certs_dir()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    if settings.environment == "development":
        return JSONResponse(status_code=500, content={"detail": str(exc)})
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
