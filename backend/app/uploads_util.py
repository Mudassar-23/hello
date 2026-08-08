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


def ensure_upload_dir() -> Path:
    settings = get_settings()
    path = Path(settings.upload_dir)
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file.")

    upload_dir = ensure_upload_dir()
    filename = f"{uuid.uuid4().hex}{ext}"
    dest = upload_dir / filename

    # Write then verify with Pillow (rejects non-images / truncated files)
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

    return filename


def project_image_url(image_path: str) -> str:
    if not image_path:
        return ""
    name = Path(image_path).name
    return f"/uploads/{name}"
