import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-with-at-least-32-bytes")

from fastapi import FastAPI
from fastapi.testclient import TestClient
from passlib.hash import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app import auth, models
from backend.app.database import Base, get_db
from backend.app.routes.auth import router


def create_test_client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    test_session = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = test_session()
        try:
            yield db
        finally:
            db.close()

    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app), test_session, engine


def test_hashing_supports_passwords_over_72_bytes_without_truncation():
    password = "é" * 40
    password_hash = auth.hash_password(password)

    assert len(password.encode("utf-8")) > 72
    assert auth.pwd_ctx.identify(password_hash) == "bcrypt_sha256"
    assert auth.verify_password(password, password_hash)
    assert not auth.verify_password("é" * 39 + "x", password_hash)


def test_register_and_login_accept_long_password_and_distinguish_suffixes():
    client, _, engine = create_test_client()
    password = "a" * 72 + "correct"

    try:
        response = client.post(
            "/auth/register",
            json={"name": "Long Password", "email": "long@example.com", "password": password},
        )
        assert response.status_code == 200

        login_response = client.post(
            "/auth/login",
            json={"email": "long@example.com", "password": password},
        )
        assert login_response.status_code == 200
        assert login_response.json()["access_token"]

        wrong_password = client.post(
            "/auth/login",
            json={"email": "long@example.com", "password": "a" * 72 + "incorrect"},
        )
        assert wrong_password.status_code == 401
    finally:
        client.close()
        engine.dispose()


def test_login_migrates_legacy_bcrypt_hash_without_changing_account():
    client, test_session, engine = create_test_client()
    db = test_session()
    legacy_user = models.User(
        name="Legacy",
        email="legacy@example.com",
        password_hash=bcrypt.hash("legacy-password"),
    )
    db.add(legacy_user)
    db.commit()
    user_id = legacy_user.id
    db.close()

    try:
        response = client.post(
            "/auth/login",
            json={"email": "legacy@example.com", "password": "legacy-password"},
        )
        assert response.status_code == 200

        db = test_session()
        migrated_user = db.query(models.User).filter_by(id=user_id).one()
        assert auth.pwd_ctx.identify(migrated_user.password_hash) == "bcrypt_sha256"
        assert auth.verify_password("legacy-password", migrated_user.password_hash)
        db.close()
    finally:
        client.close()
        engine.dispose()
