# SmartTask — Task Automation & Context-Aware Reminder Platform

A full-stack productivity app that reminds you not just **when** something is due, but **where** it becomes relevant — "remind me to buy milk when I'm near a supermarket" — using real geolocation, a real map, and a real geofencing engine, backed by a real database.

## What's implemented (working, not mocked)

- **Auth** — register/login with JWT, bcrypt password hashing, protected routes
- **Task CRUD** — create, edit, delete, complete, recurring tasks (auto-generates the next occurrence in the database on completion)
- **Time reminders** — a background scheduler (APScheduler) checks due tasks every 60s and writes real notification rows
- **Location-aware reminders** — pick a category (supermarket, pharmacy, college, etc.) or a specific place; the backend queries the **real Overpass API** (OpenStreetMap) for nearby places at your actual coordinates
- **Interactive map** — Leaflet + real OpenStreetMap tiles, showing your position, saved reminders, and geofence radii
- **Real geofencing** — `navigator.geolocation.watchPosition` feeds live coordinates into a single backend endpoint (`POST /location/check`) that computes Haversine distance and fires a real notification on entry — the same endpoint the **Demo Location Simulator** calls, so the demo never fakes the final trigger
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
The database (`smarttask.db`), tables, and demo account are created automatically on first run.

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
- **Vercel frontend:** set `VITE_API_URL` to the Render backend origin, without a trailing slash (for example, `https://your-service.onrender.com`). Vite embeds this value at build time, so redeploy the frontend after changing it.

### Demo account
```
Email:    demo@smarttask.app
Password: SmartTask123
```
Pre-populated with tasks, a recurring task, a completed task, and one live location reminder ("Nearby Supermarket") near real coordinates in Chennai, so the Overpass nearby-search returns real results out of the box.

---

## Demonstration script

1. Open the app, sign in with the demo account
2. Show the Dashboard — real stats, today's progress
3. Go to **Tasks → + New task** → title "Buy Milk", check "Remind me by location", category **Supermarket**, radius **500m**, click **Use my current location** (or leave the default) → Save
4. Go to **Location** → click **Enable real location** (grants browser permission) → click **Search** to show real nearby supermarkets pulled from OpenStreetMap on the map
5. If you're not physically near one for the live demo: use the **Demo simulator** panel → click "Move toward '<your reminder>'" — the marker animates across the map and calls the exact same `/location/check` endpoint as real GPS would
6. Watch the real notification fire: *"📍 You're near Nearby Supermarket — 'Buy Milk' is on your list."*
7. Go to **Tasks**, mark "Buy Milk" complete
8. Go to **Analytics** — show the completion rate and weekly chart update with the new real data

## Pitch

> SmartTask is a context-aware task automation and reminder platform. Unlike traditional to-do applications that only remind users at a specific time, SmartTask can understand when and where a reminder is relevant. For example, instead of simply reminding a user to buy milk at 6 PM, SmartTask can remind them when they are actually near a supermarket. By combining task management, time-based reminders, location awareness, automation, and analytics, SmartTask turns reminders into actionable assistance.
