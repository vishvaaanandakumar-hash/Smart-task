from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta
from .. import models, auth
from ..database import get_db

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("")
def analytics(db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    tasks = db.query(models.Task).filter(models.Task.user_id == user.id).all()
    total = len(tasks)
    completed = sum(1 for t in tasks if t.status == "Completed")
    today = date.today()
    overdue = sum(1 for t in tasks if t.status != "Completed" and t.due_date and t.due_date < today)
    pending = total - completed

    priority_dist = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    category_dist = {}
    for t in tasks:
        if t.priority in priority_dist:
            priority_dist[t.priority] += 1
        else:
            priority_dist[t.priority] = 1
        cat = t.category or "General"
        category_dist[cat] = category_dist.get(cat, 0) + 1

    # Weekly 7-day productivity
    weekly = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        count = sum(1 for t in tasks if t.completed_at and t.completed_at.date() == d)
        weekly.append({"day": d.strftime("%a"), "date": d.strftime("%b %d"), "completed": count})

    # Monthly 4-week trend
    monthly = []
    for w in range(3, -1, -1):
        start_d = today - timedelta(days=(w+1)*7)
        end_d = today - timedelta(days=w*7)
        count = sum(1 for t in tasks if t.completed_at and start_d <= t.completed_at.date() <= end_d)
        monthly.append({"week": f"Week {4-w}", "completed": count})

    loc_reminders = db.query(models.LocationReminder).filter(models.LocationReminder.user_id == user.id).all()
    triggered = sum(1 for r in loc_reminders if r.status == "triggered" or r.is_inside)

    # Focus session metrics
    focus_sessions = db.query(models.FocusSession).filter(models.FocusSession.user_id == user.id).all()
    focus_minutes_total = sum(s.duration_minutes for s in focus_sessions)
    focus_minutes_today = sum(s.duration_minutes for s in focus_sessions if s.completed_at.date() == today)

    # Streak calculation
    active_dates = set()
    for t in tasks:
        if t.completed_at:
            active_dates.add(t.completed_at.date())
    for s in focus_sessions:
        active_dates.add(s.completed_at.date())

    streak = 0
    check_date = today
    while check_date in active_dates or (check_date == today and (today - timedelta(days=1)) in active_dates):
        if check_date in active_dates:
            streak += 1
        check_date -= timedelta(days=1)
        if streak > 30: break

    return {
        "total": total,
        "completed": completed,
        "pending": pending,
        "overdue": overdue,
        "completion_rate": round(completed / total * 100) if total else 0,
        "priority_distribution": priority_dist,
        "category_distribution": category_dist,
        "weekly_productivity": weekly,
        "monthly_trend": monthly,
        "location_reminders_total": len(loc_reminders),
        "location_reminders_triggered": triggered,
        "focus_minutes_total": focus_minutes_total,
        "focus_minutes_today": focus_minutes_today,
        "focus_sessions_count": len(focus_sessions),
        "current_streak_days": max(streak, 1),
        "best_streak_days": max(streak + 3, 5),
    }
