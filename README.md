# SmartTask — Task Automation & Context-Aware Reminder Platform

A full-stack productivity app that reminds you not just **when** something is due, but **where** it becomes relevant — "remind me to buy milk when I'm near a supermarket" — using real geolocation, a real map, and a real geofencing engine, backed by a real database.

## What's implemented (working, not mocked)

- **Auth** — register/login with JWT, bcrypt password hashing, protected routes
- **Task CRUD** — create, edit, delete, complete, recurring tasks (auto-generates the next occurrence in the database on completion)
- **Time reminders** — a background scheduler (APScheduler) checks due tasks every 60s and writes real notification rows
- **Location-aware reminders** — pick a category (supermarket, pharmacy, college, etc.) or a specific place; the backend queries the **real Overpass API** (OpenStreetMap) for nearby places at your actual coordinates
- **Interactive map** — Leaflet + real OpenStreetMap tiles, showing your position, saved reminders, and geofence radii
- **Real geofencing** — `navigator.geolocation.watchPosition` feeds live coordinates into a single backend endpoint (`POST /location/check`) that computes Haversine distance and fires a real notification on entry
- **Automations** — simple WHEN → IF → THEN rules, persisted per user
- **Analytics** — completion rate, weekly productivity, priority distribution — all computed from live database rows, not sample charts
- **Notification center** — real unread badge, mark read/mark all read
- **Focus mode** — Pomodoro timer
- **PWA** — installable via `vite-plugin-pwa` (manifest + service worker)
- **Dark mode**, responsive layout, friendly error states (no raw stack traces surfaced to the user)

## What was intentionally left out of this pass
Calendar view, task dependencies, gamification/streaks, and a full drag-and-drop automation canvas were left out to keep this build reliable and testable in the time available. The architecture (routes, models, API client) is structured so any of these can be added without a rewrite — ask if you'd like one built out next.

---

## Project structure
```
smarttask/
├── backend/        FastAPI + SQLAlchemy + SQLite
└── frontend/       React + TypeScript + Vite + Tailwind
```

## Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # set SECRET_KEY to a random value of at least 32 bytes
uvicorn app.main:app --reload
```
The database (`smarttask.db`) and tables are created automatically on first run. A one-time migration removes the previous public demo accounts and their associated data while leaving other accounts untouched. To enable the professor presentation account, set `DEMO_ACCOUNT_PASSWORD` before starting the backend; the account and fictional sample dataset are created once and are not reset on later starts.

### Frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```

### URLs
```
Frontend:  http://localhost:5173
Backend:   http://localhost:8000
API docs:  http://localhost:8000/docs
```

## Deployment environment

- **Render backend:** build with `pip install -r backend/requirements.txt` and start with `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`. Set `SECRET_KEY` to a random value of at least 32 bytes, `CORS_ORIGINS` to the exact Vercel site origin (comma-separated if using multiple origins), and `DATABASE_URL` to a persistent database URL for production data. If `DATABASE_URL` is omitted, the app uses local SQLite storage, which is not persistent on Render by default.
- To seed the public professor demo account on Render, add `DEMO_ACCOUNT_PASSWORD` as a secret environment variable and set it to the password you want the demo account to use. The demo login email is `vishvaa@gmail.com`. This is a shared public account containing fictional data; anyone with its credentials can change that data. The account is created once and later deploys will not restore edited or deleted sample records.
- **Vercel frontend:** set `VITE_API_URL` to the Render backend origin, without a trailing slash (for example, `https://your-service.onrender.com`). Vite embeds this value at build time, so redeploy the frontend after changing it.

---

## Try the app

1. Register a personal account and sign in.
2. Create tasks and optionally attach a location reminder with manually selected coordinates or your browser's current location.
3. Open **Location** and enable GPS tracking to check saved geofences against your live location.
4. Search for real places using OpenStreetMap.
5. Complete a task and review your personal activity in **Analytics**.

## Pitch

> SmartTask is a context-aware task automation and reminder platform. Unlike traditional to-do applications that only remind users at a specific time, SmartTask can understand when and where a reminder is relevant. For example, instead of simply reminding a user to buy milk at 6 PM, SmartTask can remind them when they are actually near a supermarket. By combining task management, time-based reminders, location awareness, automation, and analytics, SmartTask turns reminders into actionable assistance.
