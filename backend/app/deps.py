import json
import time
from pathlib import Path

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AdminUser
from app.security import decode_token

bearer_scheme = HTTPBearer(auto_error=False)

# #region agent log
_DEBUG_LOG = Path(__file__).resolve().parents[2] / "debug-291d6d.log"


def _agent_log(hypothesis_id: str, location: str, message: str, data: dict | None = None) -> None:
    try:
        with _DEBUG_LOG.open("a", encoding="utf-8") as f:
            f.write(
                json.dumps(
                    {
                        "sessionId": "291d6d",
                        "runId": "pre-fix",
                        "hypothesisId": hypothesis_id,
                        "location": location,
                        "message": message,
                        "data": data or {},
                        "timestamp": int(time.time() * 1000),
                    }
                )
                + "\n"
            )
    except Exception:
        pass


# #endregion


from app.config import get_settings


def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> AdminUser:
    if credentials and credentials.scheme.lower() == "bearer":
        username = decode_token(credentials.credentials, "access")
        if username:
            user = db.query(AdminUser).filter(AdminUser.username == username).first()
            if user:
                return user

    settings = get_settings()
    if settings.environment == "development":
        admin = db.query(AdminUser).first()
        if admin:
            return admin

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
