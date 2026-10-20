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
    if not user:
        raise HTTPException(401, "Incorrect email or password.")

    is_valid, updated_hash = auth.verify_password_and_update(data.password, user.password_hash)
    if not is_valid:
        raise HTTPException(401, "Incorrect email or password.")
    if updated_hash is not None:
        user.password_hash = updated_hash
        db.commit()
    return {"access_token": auth.create_token(user.id), "user": user}

@router.get("/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(auth.get_current_user)):
    return user
