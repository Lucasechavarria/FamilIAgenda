from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# --- AUTH SCHEMAS ---
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    # Opcional: Crear familia al registrarse
    create_family_name: Optional[str] = None
    # Opcional: Unirse a familia existente
    join_family_code: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_name: str
    user_email: str

class UserRead(BaseModel):
    id: int
    email: str
    full_name: str
    avatar_url: Optional[str] = None

# --- FAMILY SCHEMAS ---
class FamilyRead(BaseModel):
    id: int
    name: str
    invitation_code: str

class FamilyCreate(BaseModel):
    name: str

class JoinFamily(BaseModel):
    invitation_code: str

# --- EVENT SCHEMAS ---
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    category: str = "general"
    visibility: str = "family"  # 'private', 'family'

class EventCreate(EventBase):
    pass

class EventRead(EventBase):
    id: int
    owner_id: Optional[int]
    family_id: Optional[int]

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    category: Optional[str] = None
    visibility: Optional[str] = None

# --- EVENT SHARE SCHEMAS ---
class EventShareCreate(BaseModel):
    shared_with_user_id: int
    can_edit: bool = False

class EventShareRead(BaseModel):
    id: int
    event_id: int
    shared_with_user_id: int
    can_edit: bool
    shared_at: datetime

# --- TASKS ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: datetime
    assigned_to_id: Optional[int] = None
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None
    notification_config: Optional[str] = '{"pre": [15], "post": false}'

class TaskCreate(TaskBase):
    pass

class TaskRead(TaskBase):
    id: int
    family_id: int
    created_by_id: int
    status: str
    completed_at: Optional[datetime] = None
    completed_by_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    assigned_to_id: Optional[int] = None
    is_recurring: Optional[bool] = None
    recurrence_pattern: Optional[str] = None
    notification_config: Optional[str] = None
    status: Optional[str] = None

# --- CHAT ---
class MessageCreate(BaseModel):
    content: str

class MessageRead(BaseModel):
    id: int
    family_id: int
    user_id: int
    content: str
    created_at: datetime
    user_name: Optional[str] = None  # Para mostrar nombre en UI

# --- AI SCHEMAS ---
class PromptUsuario(BaseModel):
    texto: str

# --- NOTIFICATION SCHEMAS ---
class TokenRegistration(BaseModel):
    token: str
    device_info: Optional[str] = None
