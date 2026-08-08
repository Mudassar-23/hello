from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser, Skill
from app.schemas import SkillCreate, SkillOut, SkillUpdate

router = APIRouter(prefix="/api/skills", tags=["skills"])


@router.get("", response_model=list[SkillOut])
def list_skills(db: Session = Depends(get_db)) -> list[Skill]:
    return db.query(Skill).order_by(Skill.sort_order.asc(), Skill.id.asc()).all()


@router.post("", response_model=SkillOut, status_code=status.HTTP_201_CREATED)
def create_skill(
    body: SkillCreate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> Skill:
    skill = Skill(name=body.name, sort_order=body.sort_order)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


@router.put("/{skill_id}", response_model=SkillOut)
def update_skill(
    skill_id: int,
    body: SkillUpdate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> Skill:
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(skill, k, v)
    db.commit()
    db.refresh(skill)
    return skill


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> None:
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    db.delete(skill)
    db.commit()
