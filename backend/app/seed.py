import json
from datetime import date, timedelta, datetime
from .database import SessionLocal, engine, Base
from . import models, auth

def seed_demo():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed demo user 1 (demo@smarttask.app)
        user = db.query(models.User).filter(models.User.email == "demo@smarttask.app").first()
        if not user:
            user = models.User(name="Vishvaa", email="demo@smarttask.app", password_hash=auth.hash_password("SmartTask123"))
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user.password_hash = auth.hash_password("SmartTask123")
            db.commit()

        # Seed demo user 2 (vishvaa@smarttask.app) so app credentials work seamlessly
        user2 = db.query(models.User).filter(models.User.email == "vishvaa@smarttask.app").first()
        if not user2:
            user2 = models.User(name="Vishvaa", email="vishvaa@smarttask.app", password_hash=auth.hash_password("Password123!"))
            db.add(user2)
            db.commit()
        else:
            user2.password_hash = auth.hash_password("Password123!")
            db.commit()

        today = date.today()

        def mk(title, days_offset, due_time, priority, category, status="Pending",
               repeat_type="None", reminder_offset="No reminder", description="",
               completed_days_ago=None, subtasks=None, dependencies=None, tags="", notes=""):
            t = models.Task(
                user_id=user.id, title=title, description=description,
                due_date=today + timedelta(days=days_offset), due_time=due_time,
                priority=priority, category=category, status=status,
                repeat_type=repeat_type, reminder_offset=reminder_offset,
                subtasks=json.dumps(subtasks or []),
                dependencies=json.dumps(dependencies or []),
                tags=tags, notes=notes
            )
            if status == "Completed":
                offset = completed_days_ago if completed_days_ago is not None else max(days_offset, 0)
                t.completed_at = datetime.utcnow() - timedelta(days=offset)
            return t

        # First pass tasks
        t_dtm = mk("DTM Project Research", -1, "17:00", "High", "Academic",
                   status="Completed", completed_days_ago=1,
                   description="Research database schema and query performance",
                   tags="college,database",
                   subtasks=[
                       {"id": "sub_1", "title": "Analyze normalization forms (3NF/BCNF)", "completed": True},
                       {"id": "sub_2", "title": "Benchmark index scan vs sequential scan", "completed": True},
                   ])
        db.add(t_dtm)
        db.commit()
        db.refresh(t_dtm)

        tasks = [
            mk("Buy Milk & Groceries", 0, "18:30", "Medium", "Shopping",
               description="Weekly essentials from the local supermarket",
               tags="groceries,personal",
               subtasks=[
                   {"id": "sub_1", "title": "Check pantry for eggs & oats", "completed": True},
                   {"id": "sub_2", "title": "Buy 2L organic fresh milk", "completed": False},
                   {"id": "sub_3", "title": "Pick up Greek yogurt & granola", "completed": False},
               ]),
            mk("Submit APP Record", 1, "23:59", "Critical", "Academic",
               reminder_offset="1 day before",
               description="Final Advanced Programming Practice lab record submission",
               dependencies=[t_dtm.id],
               tags="college,app,record",
               subtasks=[
                   {"id": "sub_1", "title": "Compile code listings and docstrings", "completed": True},
                   {"id": "sub_2", "title": "Format architecture diagrams", "completed": True},
                   {"id": "sub_3", "title": "Generate test execution screenshots", "completed": False},
                   {"id": "sub_4", "title": "Get faculty signature and stamp", "completed": False},
               ]),
            mk("Fitness Gym Workout", 0, "18:00", "Low", "Health", repeat_type="Weekly",
               tags="workout,health",
               subtasks=[
                   {"id": "sub_1", "title": "Warm up & 15m cardio", "completed": False},
                   {"id": "sub_2", "title": "Push day: chest & shoulders", "completed": False},
               ]),
            mk("Team standup notes", 0, "09:15", "Low", "Work",
               status="Completed", completed_days_ago=0),
            mk("Pay electricity bill", 2, "12:00", "High", "Finance",
               reminder_offset="1 day before"),
            mk("Refill prescription", -2, "10:00", "Critical", "Health",
               status="Completed", completed_days_ago=2,
               description="Pick up from the campus pharmacy"),
            mk("Review pull request #142", 0, "15:00", "Medium", "Work",
               status="Completed", completed_days_ago=0),
            mk("Call project mentor", -3, "19:00", "Medium", "Personal",
               status="Completed", completed_days_ago=3),
            mk("Prep slides for review", 1, "11:00", "High", "Academic"),
            mk("Grocery run — vegetables", -4, "08:30", "Low", "Personal",
               status="Completed", completed_days_ago=4),
            mk("Renew gym membership", 5, "17:00", "Medium", "Health"),
            mk("Water the plants", 0, "07:30", "Low", "Personal", repeat_type="Daily"),
            mk("Book dentist appointment", 3, "14:00", "Medium", "Health"),
            mk("Submit expense report", -1, "23:59", "High", "Work",
               status="Completed", completed_days_ago=1),
            mk("Read 20 pages of clean code", -5, "21:00", "Low", "Personal",
               status="Completed", completed_days_ago=5),
            mk("Fix authentication session timeout", -6, "16:00", "Critical", "Work",
               status="Completed", completed_days_ago=6),
            mk("Plan weekend trip", 4, "20:00", "Low", "Personal"),
            mk("Pick up dry cleaning", -1, "18:00", "Medium", "Personal"),
            mk("Backup laptop files", -8, "22:00", "Medium", "Work",
               status="Completed", completed_days_ago=8),
        ]
        db.add_all(tasks)
        db.commit()
        for t in tasks: db.refresh(t)

        by_title = {t.title: t for t in tasks}
        by_title[t_dtm.title] = t_dtm

        # Real-world coordinates (Chennai) with geofence radii
        locations = [
            models.LocationReminder(
                user_id=user.id, task_id=by_title["Buy Milk & Groceries"].id, label="Reliance Fresh Supermarket",
                category="Supermarket", address="Grand Trunk Rd, Chennai",
                lat=13.0067, lng=80.1187, radius_m=200,
                trigger_type="arrival", status="monitoring", is_inside=False
            ),
            models.LocationReminder(
                user_id=user.id, task_id=by_title["Refill prescription"].id, label="Apollo Pharmacy 24/7",
                category="Pharmacy", address="Hospital Road, Chennai",
                lat=13.0055, lng=80.1180, radius_m=300,
                trigger_type="arrival", status="triggered", is_inside=True, last_entered_at=datetime.utcnow() - timedelta(hours=2)
            ),
            models.LocationReminder(
                user_id=user.id, task_id=by_title["Fitness Gym Workout"].id, label="Gold's Fitness Gym",
                category="Gym", address="Fitness Hub, Central Road, Chennai",
                lat=13.0078, lng=80.1205, radius_m=250,
                trigger_type="arrival", status="monitoring", is_inside=False
            ),
            models.LocationReminder(
                user_id=user.id, task_id=by_title["Pick up dry cleaning"].id, label="Express Avenue Shopping Mall",
                category="Shopping mall", address="Express Way, Chennai",
                lat=13.0105, lng=80.1150, radius_m=400,
                trigger_type="arrival", status="monitoring", is_inside=False
            ),
        ]
        db.add_all(locations)

        automations = [
            models.Automation(user_id=user.id, trigger_type="Task reaches deadline", condition="Task is incomplete",
                               action_type="Send notification"),
            models.Automation(user_id=user.id, trigger_type="Arrive at a location", condition="Linked task is pending",
                               action_type="Send notification"),
            models.Automation(user_id=user.id, trigger_type="Task marked Critical", condition="Due within 24 hours",
                               action_type="Send notification"),
            models.Automation(user_id=user.id, trigger_type="Task completed", condition="Task is recurring",
                               action_type="Create next occurrence", enabled=True),
        ]
        db.add_all(automations)

        notifications = [
            models.Notification(user_id=user.id, task_id=t_dtm.id, type="system",
                                 message='✓ "DTM Project Research" completed.', is_read=True),
            models.Notification(user_id=user.id, task_id=by_title["Refill prescription"].id, type="location",
                                 message="📍 You're near Apollo Pharmacy 24/7 — \"Refill prescription\" is ready!",
                                 is_read=True),
            models.Notification(user_id=user.id, task_id=by_title["Submit APP Record"].id, type="time",
                                 message='⏰ "Submit APP Record" is due tomorrow!', is_read=False),
            models.Notification(user_id=user.id, type="system",
                                 message="👋 Welcome to SmartTask — your workspace is set up with real sample data.",
                                 is_read=False),
        ]
        db.add_all(notifications)

        # Seed focus sessions
        focus_sessions = [
            models.FocusSession(user_id=user.id, task_id=t_dtm.id, duration_minutes=25, session_type="focus",
                                completed_at=datetime.utcnow() - timedelta(hours=3), notes="Reviewed normalization"),
            models.FocusSession(user_id=user.id, task_id=by_title["Submit APP Record"].id, duration_minutes=25, session_type="focus",
                                completed_at=datetime.utcnow() - timedelta(hours=1), notes="Worked on record diagrams"),
            models.FocusSession(user_id=user.id, duration_minutes=5, session_type="short_break",
                                completed_at=datetime.utcnow() - timedelta(minutes=30), notes="Coffee break"),
        ]
        db.add_all(focus_sessions)

        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo()
    print("Demo database successfully seeded!")
