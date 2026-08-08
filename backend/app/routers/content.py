import json
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser, SiteContent
from app.schemas import ContentOut, ContentUpdate

router = APIRouter(prefix="/api/content", tags=["content"])


def _load_json(raw: str) -> dict[str, Any]:
    try:
        data = json.loads(raw)
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


def _get_map(db: Session) -> dict[str, dict[str, Any]]:
    rows = db.query(SiteContent).all()
    return {r.key: _load_json(r.value) for r in rows}


@router.get("", response_model=ContentOut)
def get_content(db: Session = Depends(get_db)) -> ContentOut:
    data = _get_map(db)
    return ContentOut(
        home=data.get("home", {}),
        about=data.get("about", {}),
        contact=data.get("contact", {}),
    )


@router.put("", response_model=ContentOut)
def update_content(
    body: ContentUpdate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> ContentOut:
    updates = {
        "home": body.home,
        "about": body.about,
        "contact": body.contact,
    }
    for key, value in updates.items():
        if value is None:
            continue
        row = db.query(SiteContent).filter(SiteContent.key == key).first()
        payload = json.dumps(value)
        if row:
            row.value = payload
        else:
            db.add(SiteContent(key=key, value=payload))
    db.commit()
    return get_content(db)
