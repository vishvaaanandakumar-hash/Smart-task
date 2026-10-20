import json
from datetime import date, datetime, timedelta

from sqlalchemy.orm import sessionmaker

from . import models


DEMO_EMAIL = "vishvaa@gmail.com"


def seed_demo_account(session_factory: sessionmaker, password: str | None) -> bool:
    if not password:
        return False

    from .auth import hash_password

    db = session_factory()
    try:
        if db.query(models.User).filter_by(email=DEMO_EMAIL).first():
            return False

        now = datetime.utcnow()
        today = date.today()
        user = models.User(
            name="Professor Demo",
            email=DEMO_EMAIL,
            password_hash=hash_password(password),
        )
        db.add(user)
        db.flush()

        tasks = [
            models.Task(
                user_id=user.id,
                title="Define research proposal",
                description="Set the scope and research question for the semester project.",
                category="Academic",
                priority="High",
                status="Completed",
                due_date=today - timedelta(days=4),
                created_at=now - timedelta(days=8),
                completed_at=now - timedelta(days=4),
                subtasks=json.dumps([
                    {"id": "research-1", "title": "Review assignment brief", "completed": True},
                    {"id": "research-2", "title": "Write research question", "completed": True},
                ]),
            ),
            models.Task(
                user_id=user.id,
                title="Collect literature review sources",
                description="Gather and annotate recent papers for the project.",
                category="Academic",
                priority="Medium",
                status="Completed",
                due_date=today - timedelta(days=2),
                created_at=now - timedelta(days=6),
                completed_at=now - timedelta(days=2),
            ),
            models.Task(
                user_id=user.id,
                title="Prepare project presentation",
                description="Create a concise presentation of the research plan and findings.",
                category="Academic",
                priority="Critical",
                status="In Progress",
                due_date=today + timedelta(days=2),
                due_time="14:00",
                created_at=now - timedelta(days=3),
                subtasks=json.dumps([
                    {"id": "presentation-1", "title": "Outline key findings", "completed": True},
                    {"id": "presentation-2", "title": "Build slides", "completed": False},
                    {"id": "presentation-3", "title": "Rehearse delivery", "completed": False},
                ]),
            ),
            models.Task(
                user_id=user.id,
                title="Study for systems examination",
                description="Review lecture notes and complete practice questions.",
                category="Academic",
                priority="High",
                status="Pending",
                due_date=today + timedelta(days=5),
                due_time="18:00",
                repeat_type="Weekly",
                created_at=now - timedelta(days=1),
            ),
            models.Task(
                user_id=user.id,
                title="Pick up project materials",
                description="Reminder uses fictional sample coordinates for the presentation.",
                category="Personal",
                priority="Medium",
                status="Pending",
                due_date=today + timedelta(days=1),
                created_at=now - timedelta(hours=8),
            ),
            models.Task(
                user_id=user.id,
                title="Work on literature review",
                description="A sample location reminder for the location-aware workflow.",
                category="Academic",
                priority="Low",
                status="Pending",
                due_date=today + timedelta(days=3),
                created_at=now - timedelta(hours=4),
            ),
        ]
        db.add_all(tasks)
        db.flush()

        db.add_all([
            models.LocationReminder(
                user_id=user.id,
                task_id=tasks[4].id,
                label="Sample Campus Supply Store",
                category="Shopping",
                address="Fictional demo location",
                lat=13.0067,
                lng=80.1187,
                radius_m=200,
            ),
            models.LocationReminder(
                user_id=user.id,
                task_id=tasks[5].id,
                label="Sample University Library",
                category="College",
                address="Fictional demo location",
                lat=13.0105,
                lng=80.1150,
                radius_m=300,
            ),
            models.Automation(
                user_id=user.id,
                trigger_type="Task reaches deadline",
                condition="Task is incomplete",
                action_type="Send notification",
                enabled=True,
            ),
            models.Automation(
                user_id=user.id,
                trigger_type="Task completed",
                condition="Task is recurring",
                action_type="Create next occurrence",
                enabled=True,
            ),
            models.Notification(
                user_id=user.id,
                task_id=tasks[2].id,
                type="time",
                message="Sample reminder: project presentation is coming up.",
                is_read=False,
                created_at=now - timedelta(minutes=30),
            ),
            models.Notification(
                user_id=user.id,
                task_id=tasks[4].id,
                type="system",
                message="Sample location reminder: pick up project materials.",
                is_read=True,
                created_at=now - timedelta(hours=3),
            ),
            models.FocusSession(
                user_id=user.id,
                task_id=tasks[0].id,
                duration_minutes=25,
                session_type="focus",
                completed_at=now - timedelta(days=2),
                notes="Sample focus session",
            ),
            models.FocusSession(
                user_id=user.id,
                task_id=tasks[1].id,
                duration_minutes=50,
                session_type="focus",
                completed_at=now - timedelta(days=1),
                notes="Sample focus session",
            ),
        ])
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
