import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .database import Base, engine
from .seed import seed_demo
from .scheduler import start_scheduler
from .routes import auth as auth_routes, tasks, location, automations, notifications, analytics, focus

load_dotenv()
Base.metadata.create_all(bind=engine)
seed_demo()

app = FastAPI(title="SmartTask API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    if not os.getenv("VERCEL"):
        start_scheduler()

@app.get("/")
def root():
    return {"status": "SmartTask API running", "version": "2.0.0", "docs": "/docs"}
