import json
from datetime import date, timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.TokenOut)
def register(data: schemas.RegisterIn, db: Session = Depends(get_db)):
    email_clean = data.email.strip().lower()
    if db.query(models.User).filter(models.User.email.ilike(email_clean)).first():
        raise HTTPException(400, "An account with this email already exists.")
    user = models.User(name=data.name.strip(), email=email_clean, password_hash=auth.hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"access_token": auth.create_token(user.id), "user": user}

@router.post("/login", response_model=schemas.TokenOut)
def login(data: schemas.LoginIn, db: Session = Depends(get_db)):
    email_clean = data.email.strip().lower()
    user = db.query(models.User).filter(models.User.email.ilike(email_clean)).first()
    
    # Check if demo account alias
    if not user and email_clean in ["demo@smarttask.app", "vishvaa@smarttask.app"]:
        user = db.query(models.User).filter(
            (models.User.email == "demo@smarttask.app") | (models.User.email == "vishvaa@smarttask.app")
        ).first()

    if not user:
        raise HTTPException(401, "Incorrect email or password.")

    # Check password, and allow demo passwords for demo accounts
    is_valid = auth.verify_password(data.password, user.password_hash)
    if not is_valid and user.email.lower() in ["demo@smarttask.app", "vishvaa@smarttask.app"]:
        if data.password in ["SmartTask123", "Password123!", "demo", "password"]:
            is_valid = True

    if not is_valid:
        raise HTTPException(401, "Incorrect email or password.")
    return {"access_token": auth.create_token(user.id), "user": user}

@router.post("/demo-login", response_model=schemas.TokenOut)
def demo_login(db: Session = Depends(get_db)):
    """Instant one-click login for demo user."""
    user = db.query(models.User).filter(
        (models.User.email == "demo@smarttask.app") | (models.User.email == "vishvaa@smarttask.app")
    ).first()
    if not user:
        from ..seed import seed_demo
        seed_demo()
        user = db.query(models.User).filter(
            (models.User.email == "demo@smarttask.app") | (models.User.email == "vishvaa@smarttask.app")
        ).first()
        if not user:
            user = models.User(name="Vishvaa", email="demo@smarttask.app", password_hash=auth.hash_password("SmartTask123"))
            db.add(user)
            db.commit()
            db.refresh(user)
    return {"access_token": auth.create_token(user.id), "user": user}

@router.get("/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(auth.get_current_user)):
    return user

@router.post("/reset-demo")
def reset_demo_data(db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    """Reset current user's data back to fresh curated demo state."""
    # Delete existing data
    db.query(models.LocationReminder).filter(models.LocationReminder.user_id == user.id).delete()
    db.query(models.Task).filter(models.Task.user_id == user.id).delete()
    db.query(models.Notification).filter(models.Notification.user_id == user.id).delete()
    db.query(models.Automation).filter(models.Automation.user_id == user.id).delete()
    db.query(models.FocusSession).filter(models.FocusSession.user_id == user.id).delete()
    db.commit()

    today = date.today()

    t_dtm = models.Task(
        user_id=user.id, title="DTM Project Research", description="Research normalization and query optimization",
        due_date=today - timedelta(days=1), due_time="17:00", priority="High", category="Academic",
        status="Completed", completed_at=datetime.utcnow() - timedelta(days=1),
        tags="college,database", subtasks=json.dumps([
            {"id": "sub_1", "title": "Analyze normalization forms (3NF/BCNF)", "completed": True},
            {"id": "sub_2", "title": "Benchmark index scan vs sequential scan", "completed": True},
        ])
    )
    db.add(t_dtm)
    db.commit()
    db.refresh(t_dtm)

    t_milk = models.Task(
        user_id=user.id, title="Buy Milk & Groceries", description="Weekly groceries from the supermarket",
        due_date=today, due_time="18:30", priority="Medium", category="Shopping",
        tags="groceries,personal", subtasks=json.dumps([
            {"id": "sub_1", "title": "Check pantry for eggs & oats", "completed": True},
            {"id": "sub_2", "title": "Buy 2L organic fresh milk", "completed": False},
            {"id": "sub_3", "title": "Pick up Greek yogurt & granola", "completed": False},
        ])
    )
    t_app = models.Task(
        user_id=user.id, title="Submit APP Record", description="Final Advanced Programming Practice lab record submission",
        due_date=today + timedelta(days=1), due_time="23:59", priority="Critical", category="Academic",
        reminder_offset="1 day before", dependencies=json.dumps([t_dtm.id]),
        tags="college,app,record", subtasks=json.dumps([
            {"id": "sub_1", "title": "Compile code listings and docstrings", "completed": True},
            {"id": "sub_2", "title": "Format architecture diagrams", "completed": True},
            {"id": "sub_3", "title": "Generate test execution screenshots", "completed": False},
            {"id": "sub_4", "title": "Get faculty signature and stamp", "completed": False},
        ])
    )
    t_gym = models.Task(
        user_id=user.id, title="Fitness Gym Workout", due_date=today, due_time="18:00",
        priority="Low", category="Health", repeat_type="Weekly", tags="workout,health"
    )
    t_bill = models.Task(
        user_id=user.id, title="Pay Electricity Bill", due_date=today + timedelta(days=2), due_time="12:00",
        priority="High", category="Finance", reminder_offset="1 day before"
    )
    db.add_all([t_milk, t_app, t_gym, t_bill])
    db.commit()
    for t in [t_milk, t_app, t_gym, t_bill]: db.refresh(t)

    # Locations
    locs = [
        models.LocationReminder(
            user_id=user.id, task_id=t_milk.id, label="Reliance Fresh Supermarket", category="Supermarket",
            address="Grand Trunk Rd, Chennai", lat=13.0067, lng=80.1187, radius_m=200,
            trigger_type="arrival", status="monitoring", is_inside=False
        ),
        models.LocationReminder(
            user_id=user.id, task_id=t_gym.id, label="Gold's Fitness Gym", category="Gym",
            address="Fitness Hub, Central Road, Chennai", lat=13.0078, lng=80.1205, radius_m=250,
            trigger_type="arrival", status="monitoring", is_inside=False
        ),
    ]
    db.add_all(locs)

    # Automations
    autos = [
        models.Automation(user_id=user.id, trigger_type="Task reaches deadline", condition="Task is incomplete", action_type="Send notification"),
        models.Automation(user_id=user.id, trigger_type="Arrive at a location", condition="Linked task is pending", action_type="Send notification"),
        models.Automation(user_id=user.id, trigger_type="Task completed", condition="Task is recurring", action_type="Create next occurrence"),
    ]
    db.add_all(autos)

    # Notifications
    notifs = [
        models.Notification(user_id=user.id, task_id=t_dtm.id, type="system", message='✓ "DTM Project Research" completed.', is_read=True),
        models.Notification(user_id=user.id, task_id=t_app.id, type="time", message='⏰ "Submit APP Record" is due tomorrow!', is_read=False),
        models.Notification(user_id=user.id, type="system", message="👋 SmartTask demo dataset freshly initialized.", is_read=False),
    ]
    db.add_all(notifs)

    # Focus session
    f_session = models.FocusSession(user_id=user.id, task_id=t_dtm.id, duration_minutes=25, session_type="focus", notes="Completed DTM research")
    db.add(f_session)

    db.commit()
    return {"ok": True, "message": "Demo data successfully reset."}
