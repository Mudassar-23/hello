# Portfolio — React + FastAPI Admin CMS

Public portfolio site with a JWT-protected admin panel to edit Home, Skills, Projects, Media, Experience, and Contact. Project website screenshots appear in the Media gallery. Contact form messages are stored for the admin inbox.

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
Admin: http://127.0.0.1:5173/admin  

Use the **same host** (`127.0.0.1` or `localhost`) for the site and `VITE_API_URL` / CORS to avoid auth cookie issues.

### Environment

**`backend/.env`**

```
ADMIN_USERNAME=your_admin
ADMIN_PASSWORD=your_strong_password
JWT_SECRET=long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
DATABASE_URL=sqlite:///./portfolio.db
ENVIRONMENT=development
```

If the password contains `#`, wrap it in quotes: `ADMIN_PASSWORD="admin@1234#"`.

On first boot the admin user is created from `ADMIN_USERNAME` / `ADMIN_PASSWORD` (stored as bcrypt hash). Changing those env values later does **not** update an existing user — delete `portfolio.db` (dev only) or update the row to re-seed.

**`frontend/.env`**

```
VITE_API_URL=http://127.0.0.1:8000
```

## Admin features

- Sign in at `/admin/login` (Admin FAB on the site)
- **Home** — hero, about text, contact links
- **Skills** — add / delete skill chips
- **Projects** — CRUD (name, GitHub link, description, tags)
- **Media** — each project screenshot upload adds a gallery item (does not overwrite previous)
- **Experience** — timeline CRUD
- **Messages** — inbox from the public contact form

## Public site sections

`Home | About | Skills | Projects | Media | Experience | Contact`

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

## Project layout

```
Portfolio/
├── frontend/          # Vite React app
├── backend/           # FastAPI API + SQLite
├── portfolio.jsx      # Original single-file artifact (reference)
└── README.md
```

## Original artifact

The standalone [`portfolio.jsx`](portfolio.jsx) file remains for reference; the live app lives under `frontend/`.
