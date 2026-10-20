import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, SessionLocal, engine
from .demo_seed import seed_demo_account
from .migrations import remove_legacy_demo_accounts
from .scheduler import start_scheduler
from .routes import auth as auth_routes, tasks, location, automations, notifications, analytics, focus

Base.metadata.create_all(bind=engine)
remove_legacy_demo_accounts(engine)

app = FastAPI(title="SmartTask API", version="2.0.0")

cors_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
if not cors_origins or "*" in cors_origins:
    raise RuntimeError("CORS_ORIGINS must contain one or more explicit frontend origins.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth_routes.router)
app.include_router(tasks.router)
app.include_router(location.router)
app.include_router(automations.router)
app.include_router(notifications.router)
app.include_router(analytics.router)
app.include_router(focus.router)

@app.on_event("startup")
def startup():
    seed_demo_account(SessionLocal, os.getenv("DEMO_ACCOUNT_PASSWORD"))
    if not os.getenv("VERCEL"):
        start_scheduler()

@app.get("/")
def root():
    return {"status": "SmartTask API running", "version": "2.0.0", "docs": "/docs"}
