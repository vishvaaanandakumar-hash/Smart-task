from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Any
from datetime import date, datetime

class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    class Config: from_attributes = True

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class LocationIn(BaseModel):
    label: str
    category: str = "Custom"
    address: Optional[str] = ""
    lat: float
    lng: float
    radius_m: int = 200
    trigger_type: str = "arrival"

class LocationOut(LocationIn):
    id: int
    status: str
    task_id: int
    is_inside: bool = False
    last_entered_at: Optional[datetime] = None
    class Config: from_attributes = True

class TaskIn(BaseModel):
    title: str
    description: Optional[str] = ""
    due_date: Optional[date] = None
    due_time: Optional[str] = None
    priority: str = "Medium"
    category: Optional[str] = ""
    repeat_type: str = "None"
    reminder_offset: str = "No reminder"
    subtasks: Optional[str] = "[]"
    dependencies: Optional[str] = "[]"
    tags: Optional[str] = ""
    notes: Optional[str] = ""
    archived: Optional[bool] = False
    location: Optional[LocationIn] = None

class TaskOut(BaseModel):
    id: int
    title: str
    description: str
    due_date: Optional[date]
    due_time: Optional[str]
    priority: str
    category: str
    status: str
    repeat_type: str
    reminder_offset: str
    subtasks: Optional[str] = "[]"
    dependencies: Optional[str] = "[]"
    tags: Optional[str] = ""
    notes: Optional[str] = ""
    archived: bool = False
    created_at: datetime
    completed_at: Optional[datetime]
    location: Optional[LocationOut] = None
    class Config: from_attributes = True

class AutomationIn(BaseModel):
    trigger_type: str
    condition: str = ""
    action_type: str
    enabled: bool = True

class AutomationOut(AutomationIn):
    id: int
    class Config: from_attributes = True

class NotificationOut(BaseModel):
    id: int
    type: str
    message: str
    is_read: bool
    created_at: datetime
    class Config: from_attributes = True

class FocusSessionIn(BaseModel):
    task_id: Optional[int] = None
    duration_minutes: int = 25
    session_type: str = "focus"
    notes: Optional[str] = ""

class FocusSessionOut(FocusSessionIn):
    id: int
    user_id: int
    completed_at: datetime
    class Config: from_attributes = True
