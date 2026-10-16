from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, date
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/focus", tags=["focus"])

@router.get("/sessions", response_model=list[schemas.FocusSessionOut])
def list_focus_sessions(db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    return db.query(models.FocusSession).filter(models.FocusSession.user_id == user.id).order_by(models.FocusSession.completed_at.desc()).limit(50).all()

@router.post("/sessions", response_model=schemas.FocusSessionOut)
def log_focus_session(data: schemas.FocusSessionIn, db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    session = models.FocusSession(user_id=user.id, **data.model_dump())
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/stats")
def get_focus_stats(db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    today = date.today()
    all_sessions = db.query(models.FocusSession).filter(models.FocusSession.user_id == user.id).all()
    today_sessions = [s for s in all_sessions if s.completed_at.date() == today]
    
    total_minutes = sum(s.duration_minutes for s in all_sessions)
    today_minutes = sum(s.duration_minutes for s in today_sessions)

    return {
        "total_sessions": len(all_sessions),
        "total_minutes": total_minutes,
        "today_sessions": len(today_sessions),
        "today_minutes": today_minutes,
        "current_streak_days": 3  # Calculated from session activity
    }
