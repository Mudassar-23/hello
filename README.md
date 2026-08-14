# Portfolio — React + FastAPI Admin CMS

Public portfolio site with a JWT-protected admin panel to edit Home, Skills, Projects, Media, Experience, and Contact. Project website screenshots appear in the Media gallery. Contact form messages are stored for the admin inbox.

### Live Demo


```
https://hello-chi-lovat.vercel.app/
```

---
## Stack

- **Frontend:** Vite + React (`frontend/`) — Three.js hero + 3D constellation background
- **Backend:** FastAPI + SQLAlchemy + SQLite (`backend/`)
- **Auth:** bcrypt password hash, short-lived JWT access token, httpOnly refresh cookie, login rate limit

## Quick start

### 1. Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
# Ensure backend\.env exists (see Environment below)

uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API: http://127.0.0.1:8000  
Docs (dev only): http://127.0.0.1:8000/docs

### 2. Frontend

```powershell
cd frontend

npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Site: http://127.0.0.1:5173  

## Security notes

- Mutating routes require `Authorization: Bearer <access_token>`
- Login limited to 5 attempts / minute / IP
- Upload validation: MIME + extension + Pillow verify (JPEG/PNG/WebP, max 2MB)
- CORS locked to configured origins
- Security headers middleware; OpenAPI docs disabled when `ENVIRONMENT=production`
- Never commit `.env`, `*.db`, or `backend/uploads/`

## Deploy

| Piece | Suggested host |
|-------|----------------|
| Frontend (`npm run build`) | Vercel / Netlify — set `VITE_API_URL` to your API URL |
| Backend (uvicorn) | Railway / Render / Fly.io — set env vars, persistent disk for SQLite + uploads |

Point production `CORS_ORIGINS` at your frontend origin and set `ENVIRONMENT=production` (enables Secure cookies + HSTS).


