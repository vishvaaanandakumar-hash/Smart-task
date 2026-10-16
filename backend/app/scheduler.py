from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from .database import SessionLocal
from . import models

OFFSET_MINUTES = {
    "15 minutes before": 15, "30 minutes before": 30,
    "1 hour before": 60, "1 day before": 1440,
}

def check_time_reminders():
    """Runs every minute: creates a real Notification row when a task's reminder offset is reached."""
    db = SessionLocal()
    try:
        now = datetime.now()
        tasks = db.query(models.Task).filter(
            models.Task.status != "Completed",
            models.Task.notified == False,
            models.Task.due_date.isnot(None),
            models.Task.reminder_offset != "No reminder",
        ).all()
        for t in tasks:
            offset = OFFSET_MINUTES.get(t.reminder_offset)
            if not offset: continue
            try:
                due_dt = datetime.combine(t.due_date, datetime.strptime(t.due_time or "23:59", "%H:%M").time())
            except ValueError:
                continue
            fire_at = due_dt - timedelta(minutes=offset)
            if fire_at <= now <= due_dt:
                db.add(models.Notification(
                    user_id=t.user_id, task_id=t.id, type="time",
                    message=f'🔔 "{t.title}" is due at {t.due_time}.'
                ))
                t.notified = True
        db.commit()
    finally:
        db.close()

def start_scheduler():
    sched = BackgroundScheduler()
    sched.add_job(check_time_reminders, "interval", seconds=60, id="time_reminders")
    sched.start()
    return sched
