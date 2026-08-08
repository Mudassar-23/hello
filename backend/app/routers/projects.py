from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser, Project
from app.schemas import ProjectCreate, ProjectOut, ProjectUpdate
from app.uploads_util import project_image_url, save_project_image

router = APIRouter(prefix="/api/projects", tags=["projects"])


def serialize_project(project: Project) -> ProjectOut:
    data = ProjectOut.model_validate(project)
    data.image_url = project_image_url(project.image_path)
    return data


@router.get("", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db)) -> list[ProjectOut]:
    rows = db.query(Project).order_by(Project.sort_order.asc(), Project.id.asc()).all()
    return [serialize_project(p) for p in rows]


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db)) -> ProjectOut:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return serialize_project(project)


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    body: ProjectCreate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> ProjectOut:
    project = Project(**body.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return serialize_project(project)


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    body: ProjectUpdate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> ProjectOut:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(project, k, v)
    db.commit()
    db.refresh(project)
    return serialize_project(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> None:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.image_path:
        settings = get_settings()
        path = Path(settings.upload_dir) / Path(project.image_path).name
        path.unlink(missing_ok=True)
    db.delete(project)
    db.commit()


@router.post("/{project_id}/image", response_model=ProjectOut)
async def upload_project_image(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> ProjectOut:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    settings = get_settings()
    if project.image_path:
        old = Path(settings.upload_dir) / Path(project.image_path).name
        old.unlink(missing_ok=True)

    filename = await save_project_image(file)
    project.image_path = filename
    if not project.caption:
        project.caption = project.name
    db.commit()
    db.refresh(project)
    return serialize_project(project)
