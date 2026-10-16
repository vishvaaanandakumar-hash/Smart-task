from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/automations", tags=["automations"])

@router.get("", response_model=list[schemas.AutomationOut])
def list_automations(db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    return db.query(models.Automation).filter(models.Automation.user_id == user.id).all()

@router.post("", response_model=schemas.AutomationOut)
def create_automation(data: schemas.AutomationIn, db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    a = models.Automation(user_id=user.id, **data.model_dump())
    db.add(a); db.commit(); db.refresh(a)
    return a

@router.put("/{aid}", response_model=schemas.AutomationOut)
def update_automation(aid: int, data: schemas.AutomationIn, db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    a = db.query(models.Automation).filter(models.Automation.id == aid, models.Automation.user_id == user.id).first()
    if not a: raise HTTPException(404, "Automation not found.")
    for k, v in data.model_dump().items(): setattr(a, k, v)
    db.commit(); db.refresh(a)
    return a

@router.delete("/{aid}")
def delete_automation(aid: int, db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    a = db.query(models.Automation).filter(models.Automation.id == aid, models.Automation.user_id == user.id).first()
    if not a: raise HTTPException(404, "Automation not found.")
    db.delete(a); db.commit()
    return {"ok": True}
