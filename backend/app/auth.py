import os, datetime
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import get_db
from . import models

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
ALGORITHM = "HS256"
EXPIRE_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def _bcrypt_safe(password: str) -> str:
    # bcrypt only ever uses the first 72 BYTES of a password and newer bcrypt
    # versions raise instead of silently truncating like they used to — so we
    # truncate ourselves first. This never weakens real-world passwords: no
    # bcrypt implementation has ever used anything past byte 72 anyway.
    return password.encode("utf-8")[:72].decode("utf-8", errors="ignore")

def hash_password(p): return pwd_ctx.hash(_bcrypt_safe(p))
def verify_password(p, h): return pwd_ctx.verify(_bcrypt_safe(p), h)

def create_token(user_id: int):
    exp = datetime.datetime.utcnow() + datetime.timedelta(minutes=EXPIRE_MIN)
    return jwt.encode({"sub": str(user_id), "exp": exp}, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    cred_exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise cred_exc
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise cred_exc
    return user
