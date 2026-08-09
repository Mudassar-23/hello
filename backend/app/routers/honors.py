from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser, HonorAward
from app.schemas import HonorAwardCreate, HonorAwardOut, HonorAwardUpdate
from app.uploads_util import ensure_upload_dir, save_honor_image

router = APIRouter(prefix="/api/honors", tags=["honors"])


def _out(h: HonorAward) -> HonorAwardOut:
    image_url = f"/uploads/{Path(h.image_path).name}" if h.image_path else ""
    return HonorAwardOut(
        id=h.id,
        title=h.title,
        issuer=h.issuer,
        issue_date=h.issue_date,
        description=h.description,
        url=h.url,
        associated_with=h.associated_with,
        image_url=image_url,
        sort_order=h.sort_order,
    )


@router.get("", response_model=list[HonorAwardOut])
def list_honors(db: Session = Depends(get_db)) -> list[HonorAwardOut]:
    rows = db.query(HonorAward).order_by(HonorAward.sort_order.asc(), HonorAward.id.asc()).all()
    return [_out(h) for h in rows]


@router.post("", response_model=HonorAwardOut, status_code=status.HTTP_201_CREATED)
def create_honor(
    body: HonorAwardCreate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> HonorAwardOut:
    honor = HonorAward(**body.model_dump())
    db.add(honor)
    db.commit()
    db.refresh(honor)
    return _out(honor)


@router.put("/{honor_id}", response_model=HonorAwardOut)
def update_honor(
    honor_id: int,
    body: HonorAwardUpdate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> HonorAwardOut:
    honor = db.query(HonorAward).filter(HonorAward.id == honor_id).first()
    if not honor:
        raise HTTPException(status_code=404, detail="Honor not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(honor, k, v)
    db.commit()
    db.refresh(honor)
    return _out(honor)


@router.post("/{honor_id}/image", response_model=HonorAwardOut)
async def upload_honor_image(
    honor_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> HonorAwardOut:
    honor = db.query(HonorAward).filter(HonorAward.id == honor_id).first()
    if not honor:
        raise HTTPException(status_code=404, detail="Honor not found")

    # Remove old image
    if honor.image_path:
        old = ensure_upload_dir() / Path(honor.image_path).name
        old.unlink(missing_ok=True)

    image_url = await save_honor_image(file)
    honor.image_path = Path(image_url).name
    db.commit()
    db.refresh(honor)
    return _out(honor)


@router.delete("/{honor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_honor(
    honor_id: int,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> Response:
    honor = db.query(HonorAward).filter(HonorAward.id == honor_id).first()
    if not honor:
        raise HTTPException(status_code=404, detail="Honor not found")
    if honor.image_path:
        (ensure_upload_dir() / Path(honor.image_path).name).unlink(missing_ok=True)
    db.delete(honor)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
