from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=list[schemas.NotificationOut])
def list_notifications(db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    return db.query(models.Notification).filter(models.Notification.user_id == user.id).order_by(models.Notification.created_at.desc()).limit(50).all()

@router.put("/{nid}/read")
def mark_read(nid: int, db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    n = db.query(models.Notification).filter(models.Notification.id == nid, models.Notification.user_id == user.id).first()
    if not n: raise HTTPException(404, "Notification not found.")
    n.is_read = True; db.commit()
    return {"ok": True}

@router.put("/read-all")
def mark_all_read(db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    db.query(models.Notification).filter(models.Notification.user_id == user.id).update({"is_read": True})
    db.commit()
    return {"ok": True}
