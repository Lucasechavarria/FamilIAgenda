from typing import List, Optional
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime

# Tabla intermedia para relación N:M entre User y Family
class FamilyMember(SQLModel, table=True):
    family_id: Optional[int] = Field(default=None, foreign_key="family.id", primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", primary_key=True)
    role: str = Field(default="member")  # admin, moderator, member
    joined_at: datetime = Field(default_factory=datetime.utcnow)

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    can_edit: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relaciones
    event: Event = Relationship(back_populates="shared_with")
    shared_with_user: User = Relationship(back_populates="shared_events")

class NotificationLog(SQLModel, table=True):
    """Registro de notificaciones programadas y enviadas"""
    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="event.id")
    user_id: int = Field(foreign_key="user.id")
    scheduled_for: datetime
    sent_at: Optional[datetime] = None
    notification_type: str  # "pre_event", "recurring_reminder", "multi_stage"
    stage: Optional[int] = None  # Para notificaciones multi-etapa (30d, 15d, etc.)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relaciones
    event: Event = Relationship(back_populates="notification_logs")

class TaskAssignmentHistory(SQLModel, table=True):
    """Historial de reasignaciones de tareas/eventos"""
    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="event.id")
    from_user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    to_user_id: int = Field(foreign_key="user.id")
    reassigned_at: datetime = Field(default_factory=datetime.utcnow)
    reason: Optional[str] = None

class NotificationToken(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    token: str = Field(unique=True)
    device_type: str  # 'web', 'android', 'ios'
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relaciones
    user: User = Relationship(back_populates="notification_tokens")

class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: str = Field(default="normal")
    status: str = Field(default="pending")
    assigned_to_id: Optional[int] = Field(default=None, foreign_key="user.id")
    family_id: int = Field(foreign_key="family.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    # Notificaciones
    notification_config: Optional[str] = Field(default='{"pre": [15], "unit": "minutes"}')
    last_notified_at: Optional[datetime] = None

class ChatMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    family_id: int = Field(foreign_key="family.id")
    user_id: int = Field(foreign_key="user.id")
    message: str
    created_at: datetime = Field(default_factory=datetime.utcnow)