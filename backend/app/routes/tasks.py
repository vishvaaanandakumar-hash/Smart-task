import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/tasks", tags=["tasks"])

def _next_due_date(due_date, repeat_type):
    if not due_date: return None
    if repeat_type == "Daily": return due_date + timedelta(days=1)
    if repeat_type == "Weekly": return due_date + timedelta(weeks=1)
    if repeat_type == "Monthly": return due_date + timedelta(days=30)
    return None

def _calculate_deadline_risk(task, all_tasks_map):
    """Deterministic deadline risk calculation."""
    if task.status == "Completed":
        return {"level": "LOW", "reason": "Task is already completed."}

    # Check dependencies
    try:
        deps = json.loads(task.dependencies) if task.dependencies else []
    except Exception:
        deps = []
    
    blocked = False
    for pid in deps:
        prereq = all_tasks_map.get(pid)
        if prereq and prereq.status != "Completed":
            blocked = True
            break
            
    if blocked:
        return {"level": "HIGH", "reason": "Blocked by incomplete prerequisite dependencies."}

    if not task.due_date:
        return {"level": "LOW", "reason": "No hard deadline assigned."}

    today = date.today()
    days_left = (task.due_date - today).days

    if days_left < 0:
        return {"level": "HIGH", "reason": f"Overdue by {abs(days_left)} day(s)."}
    elif days_left == 0:
        return {"level": "HIGH", "reason": "Due today! High deadline risk."}
    elif days_left <= 2:
        return {"level": "MEDIUM", "reason": f"Due in {days_left} day(s). Action recommended."}
    else:
        return {"level": "LOW", "reason": f"On track ({days_left} days remaining)."}

@router.get("", response_model=list[schemas.TaskOut])
def list_tasks(include_archived: bool = False, db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    query = db.query(models.Task).filter(models.Task.user_id == user.id)
    if not include_archived:
        query = query.filter(models.Task.archived == False)
    return query.all()

@router.post("", response_model=schemas.TaskOut)
def create_task(data: schemas.TaskIn, db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    task_dict = data.model_dump(exclude={"location"})
    task = models.Task(user_id=user.id, **task_dict)
    db.add(task)
    db.commit()
    db.refresh(task)

    if data.location:
        loc = models.LocationReminder(user_id=user.id, task_id=task.id, **data.location.model_dump())
        db.add(loc)
        db.commit()
        db.refresh(task)

    return task

@router.put("/{task_id}", response_model=schemas.TaskOut)
def update_task(task_id: int, data: schemas.TaskIn, db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == user.id).first()
    if not task: raise HTTPException(404, "Task not found.")

    for k, v in data.model_dump(exclude={"location"}).items():
        setattr(task, k, v)

    if data.location:
        if task.location_reminder:
            for k, v in data.location.model_dump().items():
                setattr(task.location_reminder, k, v)
        else:
            db.add(models.LocationReminder(user_id=user.id, task_id=task.id, **data.location.model_dump()))
    elif task.location_reminder:
        db.delete(task.location_reminder)

    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == user.id).first()
    if not task: raise HTTPException(404, "Task not found.")
    db.delete(task)
    db.commit()
    return {"ok": True}

@router.post("/{task_id}/complete", response_model=schemas.TaskOut)
def complete_task(task_id: int, db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == user.id).first()
    if not task: raise HTTPException(404, "Task not found.")

    was_completed = task.status == "Completed"

    # Enforce DAG Dependencies when marking as Completed
    if not was_completed:
        try:
            dep_ids = json.loads(task.dependencies) if task.dependencies else []
        except Exception:
            dep_ids = []

        if dep_ids:
            prereqs = db.query(models.Task).filter(models.Task.id.in_(dep_ids), models.Task.user_id == user.id).all()
            for p in prereqs:
                if p.status != "Completed":
                    raise HTTPException(
                        status_code=400,
                        detail=f'🔒 Cannot complete "{task.title}". Prerequisite task "{p.title}" must be completed first.'
                    )

    task.status = "Pending" if was_completed else "Completed"
    task.completed_at = None if was_completed else datetime.utcnow()

    # Recurring task spawn
    if not was_completed and task.repeat_type != "None":
        nd = _next_due_date(task.due_date, task.repeat_type)
        clone = models.Task(
            user_id=user.id,
            title=task.title,
            description=task.description,
            due_date=nd,
            due_time=task.due_time,
            priority=task.priority,
            category=task.category,
            status="Pending",
            repeat_type=task.repeat_type,
            reminder_offset=task.reminder_offset,
            subtasks=task.subtasks,
            dependencies="[]",
            tags=task.tags,
            notes=task.notes
        )
        db.add(clone)
        db.add(models.Notification(user_id=user.id, type="system", message=f'🔁 Next recurrence of "{task.title}" scheduled for {nd}.'))

    if not was_completed:
        db.add(models.Notification(user_id=user.id, task_id=task.id, type="system", message=f'✓ "{task.title}" completed!'))

    db.commit()
    db.refresh(task)
    return task

@router.post("/{task_id}/duplicate", response_model=schemas.TaskOut)
def duplicate_task(task_id: int, db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == user.id).first()
    if not task: raise HTTPException(404, "Task not found.")

    clone = models.Task(
        user_id=user.id,
        title=f"{task.title} (Copy)",
        description=task.description,
        due_date=task.due_date,
        due_time=task.due_time,
        priority=task.priority,
        category=task.category,
        status="Pending",
        repeat_type=task.repeat_type,
        reminder_offset=task.reminder_offset,
        subtasks=task.subtasks,
        dependencies="[]",
        tags=task.tags,
        notes=task.notes
    )
    db.add(clone)
    db.commit()
    db.refresh(clone)
    return clone

@router.post("/{task_id}/archive", response_model=schemas.TaskOut)
def toggle_archive(task_id: int, db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == user.id).first()
    if not task: raise HTTPException(404, "Task not found.")
    task.archived = not bool(task.archived)
    db.commit()
    db.refresh(task)
    return task

@router.post("/breakdown")
def smart_breakdown(data: dict):
    """
    Decomposes a major goal or task into structured sequential subtasks.
    Heuristic, robust, fast, and does not require third-party AI keys.
    """
    title = data.get("title", "").strip()
    category = data.get("category", "General")

    t_lower = title.lower()
    
    if any(k in t_lower for k in ["report", "paper", "assignment", "thesis", "essay"]):
        subtasks = [
            {"id": "sub_1", "title": "Literature & background research", "completed": False},
            {"id": "sub_2", "title": "Draft table of contents and outline", "completed": False},
            {"id": "sub_3", "title": "Write introduction and problem statement", "completed": False},
            {"id": "sub_4", "title": "Compile data, diagrams and results", "completed": False},
            {"id": "sub_5", "title": "Write conclusion and references", "completed": False},
            {"id": "sub_6", "title": "Proofread and export PDF submission", "completed": False},
        ]
    elif any(k in t_lower for k in ["project", "app", "code", "software", "website"]):
        subtasks = [
            {"id": "sub_1", "title": "Gather requirements and define architecture", "completed": False},
            {"id": "sub_2", "title": "Design UI wireframes and database schema", "completed": False},
            {"id": "sub_3", "title": "Implement core backend API endpoints", "completed": False},
            {"id": "sub_4", "title": "Build interactive frontend screens and state", "completed": False},
            {"id": "sub_5", "title": "Run integration tests and bug fixes", "completed": False},
            {"id": "sub_6", "title": "Package build and prepare release walkthrough", "completed": False},
        ]
    elif any(k in t_lower for k in ["exam", "study", "revision", "test", "midterm"]):
        subtasks = [
            {"id": "sub_1", "title": "Review syllabus and identify high-weight topics", "completed": False},
            {"id": "sub_2", "title": "Create concise summary flashcards", "completed": False},
            {"id": "sub_3", "title": "Solve previous 3 years' question papers", "completed": False},
            {"id": "sub_4", "title": "Clarify doubts on difficult modules", "completed": False},
            {"id": "sub_5", "title": "Final mock timed revision test", "completed": False},
        ]
    elif any(k in t_lower for k in ["presentation", "slide", "pitch", "seminar"]):
        subtasks = [
            {"id": "sub_1", "title": "Structure 10-slide narrative and key takeaways", "completed": False},
            {"id": "sub_2", "title": "Design visual deck with diagrams and metrics", "completed": False},
            {"id": "sub_3", "title": "Script speaker talking points per slide", "completed": False},
            {"id": "sub_4", "title": "Do 2 full dry-run rehearsals with timer", "completed": False},
        ]
    else:
        subtasks = [
            {"id": "sub_1", "title": f"Plan scope and milestones for '{title}'", "completed": False},
            {"id": "sub_2", "title": "Gather necessary materials and references", "completed": False},
            {"id": "sub_3", "title": "Execute first core deliverable", "completed": False},
            {"id": "sub_4", "title": "Review progress and adjust details", "completed": False},
            {"id": "sub_5", "title": "Finalize and mark complete", "completed": False},
        ]

    return {"title": title, "subtasks": subtasks}
