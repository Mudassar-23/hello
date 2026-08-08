from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser, Project
from app.schemas import MediaOut
from app.uploads_util import project_image_url

router = APIRouter(prefix="/api/media", tags=["media"])


@router.get("", response_model=list[MediaOut])
def list_media(db: Session = Depends(get_db)) -> list[MediaOut]:
    rows = (
        db.query(Project)
        .filter(Project.image_path != "")
        .order_by(Project.sort_order.asc(), Project.id.asc())
        .all()
    )
    return [
        MediaOut(
            id=p.id,
            name=p.name,
            caption=p.caption or p.name,
            image_url=project_image_url(p.image_path),
            github_url=p.github_url,
        )
        for p in rows
    ]


@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media(
    media_id: int,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> Response:
    project = db.query(Project).filter(Project.id == media_id).first()
    if not project or not project.image_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")

    settings = get_settings()
    file_path = Path(settings.upload_dir) / Path(project.image_path).name
    file_path.unlink(missing_ok=True)

    project.image_path = ""
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


