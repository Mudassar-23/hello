import shutil
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from PIL import Image

from app.config import get_settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
MIME_BY_EXT = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}

ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".webm", ".ogg", ".mov", ".mkv"}
ALLOWED_VIDEO_MIME = {
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    "video/x-matroska",
}


def ensure_upload_dir() -> Path:
    settings = get_settings()
    path = Path(settings.upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def ensure_frontend_uploads_dir() -> Path:
    root = Path(__file__).resolve().parent.parent.parent
    path = root / "frontend" / "public" / "uploads"
    path.mkdir(parents=True, exist_ok=True)
    return path


def ensure_frontend_videos_dir() -> Path:
    root = Path(__file__).resolve().parent.parent.parent
    path = root / "frontend" / "public" / "videos"
    path.mkdir(parents=True, exist_ok=True)
    return path


async def save_project_image(file: UploadFile) -> str:
    settings = get_settings()
    if not file.content_type or file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image type. Allowed: JPEG, PNG, WebP.",
        )

    original = file.filename or "upload"
    ext = Path(original).suffix.lower()
    if ext == ".jpeg":
        ext = ".jpg"
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file extension. Allowed: .jpg, .png, .webp.",
        )

    data = await file.read()
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Max size is 2MB.",
        )
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file."
        )

    upload_dir = ensure_upload_dir()
    filename = f"{uuid.uuid4().hex}{ext}"
    dest = upload_dir / filename

    # Write then verify with Pillow
    dest.write_bytes(data)
    try:
        with Image.open(dest) as img:
            img.verify()
        with Image.open(dest) as img:
            img.load()
            if img.format not in {"JPEG", "PNG", "WEBP"}:
                raise ValueError("Unsupported format")
    except Exception:
        dest.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is not a valid image.",
        ) from None

    # Copy to frontend/public/uploads as well
    try:
        frontend_dest = ensure_frontend_uploads_dir() / filename
        frontend_dest.write_bytes(data)
    except Exception:
        pass

    return filename


def ensure_backend_videos_dir() -> Path:
    path = ensure_upload_dir() / "videos"
    path.mkdir(parents=True, exist_ok=True)
    return path


async def save_project_video(file: UploadFile) -> str:
    original = file.filename or "video.mp4"
    ext = Path(original).suffix.lower()
    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        ext = ".mp4"

    data = await file.read()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Empty video file."
        )

    filename = f"{uuid.uuid4().hex}{ext}"

    # 1. Save to backend uploads/videos
    backend_video_dir = ensure_backend_videos_dir()
    backend_dest = backend_video_dir / filename
    backend_dest.write_bytes(data)

    # 2. Save to frontend/public/videos
    try:
        frontend_dir = ensure_frontend_videos_dir()
        frontend_dest = frontend_dir / filename
        frontend_dest.write_bytes(data)
    except Exception as e:
        print(f"Notice: Could not sync to frontend videos: {e}")

    return f"/videos/{filename}"


def project_image_url(image_path: str) -> str:
    if not image_path:
        return ""
    name = Path(image_path).name
    return f"/uploads/{name}"


def ensure_frontend_certs_dir() -> Path:
    root = Path(__file__).resolve().parent.parent.parent
    path = root / "frontend" / "public" / "certs"
    path.mkdir(parents=True, exist_ok=True)
    return path


def ensure_backend_certs_dir() -> Path:
    path = ensure_upload_dir() / "certs"
    path.mkdir(parents=True, exist_ok=True)
    return path


ALLOWED_PDF_MIME = {"application/pdf"}


async def save_certification_pdf(file: UploadFile) -> str:
    """Save a PDF to backend/uploads/certs/ and sync to frontend/public/certs/."""
    if file.content_type and file.content_type not in ALLOWED_PDF_MIME:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed for certifications.",
        )
    data = await file.read()
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty PDF file.")

    filename = f"{uuid.uuid4().hex}.pdf"

    # 1. Save to backend/uploads/certs/
    backend_dir = ensure_backend_certs_dir()
    (backend_dir / filename).write_bytes(data)

    # 2. Sync to frontend/public/certs/
    try:
        (ensure_frontend_certs_dir() / filename).write_bytes(data)
    except Exception as e:
        print(f"Notice: Could not sync PDF to frontend: {e}")

    return f"/certs/{filename}"


async def save_honor_image(file: UploadFile) -> str:
    """Save a shield/badge image to backend/uploads/ and sync to frontend/public/uploads/."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty image file.")

    original = file.filename or "image.png"
    ext = Path(original).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".png"

    filename = f"{uuid.uuid4().hex}{ext}"

    # 1. Save to backend/uploads/
    (ensure_upload_dir() / filename).write_bytes(data)

    # 2. Sync to frontend/public/uploads/
    try:
        (ensure_frontend_uploads_dir() / filename).write_bytes(data)
    except Exception as e:
        print(f"Notice: Could not sync honor image to frontend: {e}")

    return f"/uploads/{filename}"


