from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser, Certification
from app.schemas import CertificationCreate, CertificationOut, CertificationUpdate
from app.uploads_util import ensure_backend_certs_dir, save_certification_pdf

router = APIRouter(prefix="/api/certifications", tags=["certifications"])


def _out(c: Certification) -> CertificationOut:
    pdf_url = f"/certs/{Path(c.pdf_path).name}" if c.pdf_path else ""
    return CertificationOut(
        id=c.id,
        name=c.name,
        issuer=c.issuer,
        issue_date=c.issue_date,
        pdf_url=pdf_url,
        sort_order=c.sort_order,
    )


@router.get("", response_model=list[CertificationOut])
def list_certifications(db: Session = Depends(get_db)) -> list[CertificationOut]:
    rows = db.query(Certification).order_by(Certification.sort_order.asc(), Certification.id.asc()).all()
    return [_out(c) for c in rows]


@router.post("", response_model=CertificationOut, status_code=status.HTTP_201_CREATED)
def create_certification(
    body: CertificationCreate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> CertificationOut:
    cert = Certification(**body.model_dump())
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return _out(cert)


@router.put("/{cert_id}", response_model=CertificationOut)
def update_certification(
    cert_id: int,
    body: CertificationUpdate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> CertificationOut:
    cert = db.query(Certification).filter(Certification.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(cert, k, v)
    db.commit()
    db.refresh(cert)
    return _out(cert)


@router.post("/{cert_id}/pdf", response_model=CertificationOut)
async def upload_cert_pdf(
    cert_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> CertificationOut:
    cert = db.query(Certification).filter(Certification.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")

    # Remove old PDF
    if cert.pdf_path:
        old = ensure_backend_certs_dir() / Path(cert.pdf_path).name
        old.unlink(missing_ok=True)

    pdf_url = await save_certification_pdf(file)
    cert.pdf_path = Path(pdf_url).name  # store just filename
    db.commit()
    db.refresh(cert)
    return _out(cert)


@router.delete("/{cert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_certification(
    cert_id: int,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> Response:
    cert = db.query(Certification).filter(Certification.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")
    if cert.pdf_path:
        (ensure_backend_certs_dir() / Path(cert.pdf_path).name).unlink(missing_ok=True)
    db.delete(cert)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
