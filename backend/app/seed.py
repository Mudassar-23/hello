import json

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import AdminUser, Experience, Project, SiteContent, Skill
from app.security import hash_password

DEFAULT_HOME = {
    "eyebrow": "BOARD REV. 2026.08 — LAHORE, PK",
    "headline_line1": "Computer",
    "headline_line2": "engineer, wired",
    "headline_accent": "intelligence.",
    "subheadline": "",
    "cta_primary": "View projects",
    "cta_secondary": "Get in touch",
    "meta_repos": "21 on GitHub",
    "meta_focus": "Embedded · Edge AI · IoT",
    "meta_location": "Pakistan",
    "name": "Mudassar Hussain",
    "brand": "MUDASSAR.HUSSAIN",
}

DEFAULT_ABOUT = {
    "eyebrow": "About",
    "title": "",
    "paragraphs": [],
}

DEFAULT_CONTACT = {
    "title": "Let's connect two boards.",
    "email": "infonxhussain@gmail.com",
    "github": "https://github.com/Mudassar-23",
    "linkedin": "https://www.linkedin.com/in/mudassar-hussain-8952102a0/",
    "handle": "Mudassar-23",
    "linkedin_label": "in/mudassar-hussain-8952102a0",
}

DEFAULT_SKILLS = [
    "C++",
    "Python",
    "Arduino",
    "OpenCV",
    "MATLAB",
    "Linux",
    "Proteus",
    "MySQL",
    "Visual Studio",
]

DEFAULT_PROJECTS = [
    {
        "ref": "IC1",
        "tag": "ML · WEB",
        "name": "House Price Prediction App",
        "lang": "JavaScript",
        "stars": 1,
        "description": (
            "A web app that estimates property prices from listing features, "
            "pairing a trained regression model with a clean, interactive front end."
        ),
        "github_url": "https://github.com/Mudassar-23/House-Price-Prediction-App",
    },
]

DEFAULT_EXPERIENCE = [
    {
        "title": "Computer Engineering Student",
        "company": "University",
        "start_date": "2022",
        "end_date": "Present",
        "description": (
            "Building projects across embedded systems, computer vision, and "
            "machine learning — from breadboard prototypes to shipped web apps."
        ),
        "sort_order": 0,
    },
]


def _set_content(db: Session, key: str, value: dict) -> None:
    row = db.query(SiteContent).filter(SiteContent.key == key).first()
    payload = json.dumps(value)
    if row:
        if key == "contact":
            current = json.loads(row.value) if row.value else {}
            if isinstance(current, dict) and (
                "instagram" in current or "instagram_label" in current
            ):
                current.pop("instagram", None)
                current.pop("instagram_label", None)
                row.value = json.dumps(current)
        return
    db.add(SiteContent(key=key, value=payload))


def seed_database(db: Session) -> None:
    settings = get_settings()

    admin = (
        db.query(AdminUser)
        .filter(AdminUser.username == settings.admin_username)
        .first()
    )
    if not admin:
        # Replace any leftover bootstrap users with the configured username
        db.query(AdminUser).delete()
        db.add(
            AdminUser(
                username=settings.admin_username,
                password_hash=hash_password(settings.admin_password),
            )
        )

    _set_content(db, "home", DEFAULT_HOME)
    _set_content(db, "about", DEFAULT_ABOUT)
    _set_content(db, "contact", DEFAULT_CONTACT)

    if not db.query(Skill).first():
        for i, name in enumerate(DEFAULT_SKILLS):
            db.add(Skill(name=name, sort_order=i))

    if not db.query(Project).first():
        for i, p in enumerate(DEFAULT_PROJECTS):
            db.add(
                Project(
                    ref=p["ref"],
                    name=p["name"],
                    github_url=p["github_url"],
                    description=p["description"],
                    tag=p["tag"],
                    lang=p["lang"],
                    stars=p["stars"],
                    sort_order=i,
                )
            )

    if not db.query(Experience).first():
        for e in DEFAULT_EXPERIENCE:
            db.add(Experience(**e))

    db.commit()
