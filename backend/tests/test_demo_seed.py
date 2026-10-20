import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-with-at-least-32-bytes")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app import auth, models
from backend.app.database import Base
from backend.app.demo_seed import DEMO_EMAIL, seed_demo_account


def test_demo_account_is_created_once_with_sample_data():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    test_session = sessionmaker(bind=engine)

    try:
        assert seed_demo_account(test_session, None) is False
        assert seed_demo_account(test_session, "professor-demo-test-password") is True

        db = test_session()
        user = db.query(models.User).filter_by(email=DEMO_EMAIL).one()
        original_password_hash = user.password_hash
        assert auth.verify_password("professor-demo-test-password", user.password_hash)
        assert len(user.tasks) == 6
        assert db.query(models.LocationReminder).filter_by(user_id=user.id).count() == 2
        assert db.query(models.Automation).filter_by(user_id=user.id).count() == 2
        assert db.query(models.Notification).filter_by(user_id=user.id).count() == 2
        assert db.query(models.FocusSession).filter_by(user_id=user.id).count() == 2

        first_task = db.query(models.Task).filter_by(user_id=user.id).first()
        first_task.title = "Edited presentation sample"
        db.commit()
        db.close()

        assert seed_demo_account(test_session, "another-password") is False
        db = test_session()
        existing_user = db.query(models.User).filter_by(email=DEMO_EMAIL).one()
        assert existing_user.password_hash == original_password_hash
        assert db.query(models.Task).filter_by(title="Edited presentation sample").count() == 1
        assert db.query(models.Task).filter_by(user_id=existing_user.id).count() == 6
        db.close()
    finally:
        engine.dispose()
