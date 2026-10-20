from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app import models
from backend.app.database import Base
from backend.app.migrations import remove_legacy_demo_accounts


def test_legacy_demo_cleanup_removes_only_target_accounts_and_is_idempotent():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    test_session = sessionmaker(bind=engine)
    db = test_session()

    demo_user = models.User(
        name="Former Demo",
        email="DEMO@SMARTTASK.APP",
        password_hash="unused",
    )
    second_demo_user = models.User(
        name="Legacy Demo",
        email="vishvaa@smarttask.app",
        password_hash="unused",
    )
    regular_user = models.User(
        name="Regular User",
        email="regular@example.com",
        password_hash="unused",
    )
    db.add_all([demo_user, second_demo_user, regular_user])
    db.flush()
    regular_user_id = regular_user.id

    for user in (demo_user, second_demo_user, regular_user):
        task = models.Task(user_id=user.id, title=f"{user.name} task")
        db.add(task)
        db.flush()
        db.add_all(
            [
                models.LocationReminder(
                    user_id=user.id,
                    task_id=task.id,
                    label=f"{user.name} location",
                    lat=1.0,
                    lng=2.0,
                ),
                models.Notification(user_id=user.id, message=f"{user.name} notification"),
                models.Automation(
                    user_id=user.id,
                    trigger_type="task_completed",
                    action_type="notify",
                ),
                models.FocusSession(user_id=user.id),
            ]
        )
    db.commit()
    db.close()

    try:
        remove_legacy_demo_accounts(engine)
        remove_legacy_demo_accounts(engine)

        db = test_session()
        assert [user.email for user in db.query(models.User).all()] == ["regular@example.com"]
        for model in (
            models.Task,
            models.LocationReminder,
            models.Notification,
            models.Automation,
            models.FocusSession,
        ):
            assert db.query(model).count() == 1
            assert db.query(model).one().user_id == regular_user_id
        db.close()
    finally:
        engine.dispose()
