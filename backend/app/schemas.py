from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=128)


class MessageResponse(BaseModel):
    message: str


class SkillBase(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    sort_order: int = 0


class SkillCreate(SkillBase):
    pass


class SkillUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=128)
    sort_order: Optional[int] = None


class SkillOut(SkillBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ExperienceBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    company: str = ""
    start_date: str = ""
    end_date: str = ""
    description: str = ""
    sort_order: int = 0


class ExperienceCreate(ExperienceBase):
    pass


class ExperienceUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    company: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None


class ExperienceOut(ExperienceBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ProjectBase(BaseModel):
    ref: str = ""
    name: str = Field(min_length=1, max_length=200)
    github_url: str = ""
    live_url: str = ""
    description: str = ""
    tag: str = ""
    lang: str = ""
    stars: int = 0
    caption: str = ""
    sort_order: int = 0


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    ref: Optional[str] = None
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    description: Optional[str] = None
    tag: Optional[str] = None
    lang: Optional[str] = None
    stars: Optional[int] = None
    caption: Optional[str] = None
    sort_order: Optional[int] = None


class ProjectOut(ProjectBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    image_url: str = ""


class MediaOut(BaseModel):
    id: int
    name: str
    caption: str = ""
    image_url: str
    video_url: str = ""
    github_url: str = ""
    sort_order: int = 0


class ContentOut(BaseModel):
    home: dict[str, Any]
    about: dict[str, Any]
    contact: dict[str, Any]


class ContentUpdate(BaseModel):
    home: Optional[dict[str, Any]] = None
    about: Optional[dict[str, Any]] = None
    contact: Optional[dict[str, Any]] = None


class ContactMessageCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=200)
    message: str = Field(min_length=1, max_length=4000)


class ContactMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    message: str
    created_at: Optional[Any] = None


# ── Certifications ──────────────────────────────────────────────────────────────

class CertificationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=300)
    issuer: str = ""
    issue_date: str = ""
    sort_order: int = 0


class CertificationUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=300)
    issuer: Optional[str] = None
    issue_date: Optional[str] = None
    sort_order: Optional[int] = None


class CertificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    issuer: str = ""
    issue_date: str = ""
    pdf_url: str = ""
    sort_order: int = 0


# ── Honors & Awards ─────────────────────────────────────────────────────────────

class HonorAwardCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    issuer: str = ""
    issue_date: str = ""
    description: str = ""
    url: str = ""
    associated_with: str = ""
    sort_order: int = 0


class HonorAwardUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=300)
    issuer: Optional[str] = None
    issue_date: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    associated_with: Optional[str] = None
    sort_order: Optional[int] = None


class HonorAwardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    issuer: str = ""
    issue_date: str = ""
    description: str = ""
    url: str = ""
    associated_with: str = ""
    image_url: str = ""
    sort_order: int = 0
