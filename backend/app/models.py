from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Date, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    tasks = relationship("Task", back_populates="owner", cascade="all, delete")
    focus_sessions = relationship("FocusSession", back_populates="user", cascade="all, delete")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    description = Column(String, default="")
    due_date = Column(Date, nullable=True)
    due_time = Column(String, nullable=True)
    priority = Column(String, default="Medium")  # Low, Medium, High, Critical
    category = Column(String, default="")        # Academic, Personal, Work, Shopping, Health
    status = Column(String, default="Pending")   # Pending, In Progress, Completed, Archived
    repeat_type = Column(String, default="None") # None, Daily, Weekly, Monthly, Custom
    reminder_offset = Column(String, default="No reminder")
    subtasks = Column(Text, default="[]")        # JSON string of [{ id, title, completed }]
    dependencies = Column(Text, default="[]")    # JSON string of prerequisite task IDs [1, 2]
    tags = Column(String, default="")
    notes = Column(Text, default="")
    archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    notified = Column(Boolean, default=False)

    owner = relationship("User", back_populates="tasks")
    location_reminder = relationship("LocationReminder", back_populates="task", uselist=False, cascade="all, delete")

class LocationReminder(Base):
    __tablename__ = "location_reminders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    task_id = Column(Integer, ForeignKey("tasks.id"))
    label = Column(String, nullable=False)
    category = Column(String, default="Custom")
    address = Column(String, default="")
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    radius_m = Column(Integer, default=200)
    trigger_type = Column(String, default="arrival")  # arrival, departure
    status = Column(String, default="monitoring")     # monitoring, disabled, triggered
    is_inside = Column(Boolean, default=False)        # State machine: tracks whether user is currently inside geofence
    last_entered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="location_reminder")

class Automation(Base):
    __tablename__ = "automations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    trigger_type = Column(String, nullable=False)
    condition = Column(String, default="")
    action_type = Column(String, nullable=False)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    type = Column(String, default="system")  # time, location, system
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class FocusSession(Base):
    __tablename__ = "focus_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    duration_minutes = Column(Integer, default=25)
    session_type = Column(String, default="focus")  # focus, short_break, long_break
    completed_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, default="")

    user = relationship("User", back_populates="focus_sessions")
