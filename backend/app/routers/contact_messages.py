from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser, ContactMessage
from app.routers.auth import limiter
from app.schemas import ContactMessageCreate, ContactMessageOut, MessageResponse

router = APIRouter(prefix="/api/contact", tags=["contact"])


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("8/minute")
def submit_contact(
    request: Request,
    body: ContactMessageCreate,
    db: Session = Depends(get_db),
) -> MessageResponse:
    db.add(
        ContactMessage(
            name=body.name.strip(),
            email=body.email.strip(),
            message=body.message.strip(),
        )
    )
    db.commit()
    return MessageResponse(message="Message sent. Thanks for reaching out.")


@router.get("/messages", response_model=list[ContactMessageOut])
def list_messages(
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> list[ContactMessage]:
    return (
        db.query(ContactMessage)
        .order_by(ContactMessage.created_at.desc(), ContactMessage.id.desc())
        .limit(100)
        .all()
    )


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> Response:
    msg = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    db.delete(msg)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


