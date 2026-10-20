from sqlalchemy import Column, MetaData, String, Table, delete, func, insert, select
from sqlalchemy.engine import Engine

from . import models


_metadata = MetaData()
_schema_migrations = Table(
    "schema_migrations",
    _metadata,
    Column("revision", String(100), primary_key=True),
)

_REMOVE_LEGACY_DEMO_ACCOUNTS = "remove_legacy_demo_accounts_v1"
_LEGACY_DEMO_EMAILS = ("demo@smarttask.app", "vishvaa@smarttask.app")


def remove_legacy_demo_accounts(engine: Engine) -> None:
    _schema_migrations.create(engine, checkfirst=True)

    with engine.begin() as connection:
        already_applied = connection.execute(
            select(_schema_migrations.c.revision).where(
                _schema_migrations.c.revision == _REMOVE_LEGACY_DEMO_ACCOUNTS
            )
        ).first()
        if already_applied:
            return

        demo_user_ids = select(models.User.id).where(
            func.lower(models.User.email).in_(_LEGACY_DEMO_EMAILS)
        )
        for table in (
            models.LocationReminder.__table__,
            models.Notification.__table__,
            models.Automation.__table__,
            models.FocusSession.__table__,
            models.Task.__table__,
        ):
            connection.execute(delete(table).where(table.c.user_id.in_(demo_user_ids)))

        connection.execute(delete(models.User.__table__).where(models.User.id.in_(demo_user_ids)))
        connection.execute(
            insert(_schema_migrations).values(revision=_REMOVE_LEGACY_DEMO_ACCOUNTS)
        )
