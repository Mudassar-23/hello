from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser, Experience
from app.schemas import ExperienceCreate, ExperienceOut, ExperienceUpdate

router = APIRouter(prefix="/api/experience", tags=["experience"])


@router.get("", response_model=list[ExperienceOut])
def list_experience(db: Session = Depends(get_db)) -> list[Experience]:
    return (
        db.query(Experience)
        .order_by(Experience.sort_order.asc(), Experience.id.asc())
        .all()
    )


@router.post("", response_model=ExperienceOut, status_code=status.HTTP_201_CREATED)
def create_experience(
    body: ExperienceCreate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> Experience:
    item = Experience(**body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=ExperienceOut)
def update_experience(
    item_id: int,
    body: ExperienceUpdate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> Experience:
    item = db.query(Experience).filter(Experience.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Experience not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experience(
    item_id: int,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> None:
    item = db.query(Experience).filter(Experience.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Experience not found")
    db.delete(item)
    db.commit()
