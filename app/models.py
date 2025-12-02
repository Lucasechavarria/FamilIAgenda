from typing import List, Optional
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime, timezone

# Tabla intermedia para relación N:M entre User y Family
class FamilyMember(SQLModel, table=True):
    family_id: Optional[int] = Field(default=None, foreign_key="family.id", primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", primary_key=True)
    role: str = Field(default="member")  # admin, moderator, member
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    full_name: str
    hashed_password: str
    avatar_url: Optional[str] = None
    color: str = Field(default="#3B82F6")  # Color personal para identificación visual
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relaciones
    families: List["Family"] = Relationship(back_populates="members", link_model=FamilyMember)
    created_events: List["Event"] = Relationship(
        back_populates="owner",
        sa_relationship_kwargs={"foreign_keys": "[Event.owner_id]"}
    )
    assigned_events: List["Event"] = Relationship(
        back_populates="assigned_to",
        sa_relationship_kwargs={"foreign_keys": "[Event.assigned_to_id]"}
    )
    completed_events: List["Event"] = Relationship(
        back_populates="completed_by",
        sa_relationship_kwargs={"foreign_keys": "[Event.completed_by_id]"}
    )
    notification_tokens: List["NotificationToken"] = Relationship(back_populates="user")
    shared_events: List["EventShare"] = Relationship(back_populates="shared_with_user")

class Family(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    invitation_code: str = Field(unique=True, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relaciones
    members: List[User] = Relationship(back_populates="families", link_model=FamilyMember)
    events: List["Event"] = Relationship(back_populates="family")

class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    category: str = Field(default="general")  # home, school, work, health
    priority: str = Field(default="normal")  # low, normal, high, critical
    visibility: str = "family"  # 'private', 'family'
    
    # Recurrencia
    is_recurring: bool = Field(default=False)
    recurrence_pattern: Optional[str] = None
    
    # Notificaciones
    notification_config: Optional[str] = Field(default='{"pre": [15], "post": false}')
    last_notified_at: Optional[datetime] = None
    
    # Asignación
    assigned_to_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    # Estado
    status: str = Field(default="pending")
    completed_at: Optional[datetime] = None
    completed_by_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    # Relaciones
    owner_id: int = Field(foreign_key="user.id")
    family_id: int = Field(foreign_key="family.id")
    owner: User = Relationship(
        back_populates="created_events",
        sa_relationship_kwargs={"foreign_keys": "[Event.owner_id]"}
    )
    assigned_to: Optional[User] = Relationship(
        back_populates="assigned_events",
        sa_relationship_kwargs={"foreign_keys": "[Event.assigned_to_id]"}
    )
    completed_by: Optional[User] = Relationship(
        back_populates="completed_events",
        sa_relationship_kwargs={"foreign_keys": "[Event.completed_by_id]"}
    )
    family: Family = Relationship(back_populates="events")
    shared_with: List["EventShare"] = Relationship(back_populates="event")
    notification_logs: List["NotificationLog"] = Relationship(back_populates="event")

class EventShare(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="event.id")
    shared_with_user_id: int = Field(foreign_key="user.id")
    can_edit: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relaciones
    event: Event = Relationship(back_populates="shared_with")
    shared_with_user: User = Relationship(back_populates="shared_events")

class NotificationLog(SQLModel, table=True):
    """Registro de notificaciones programadas y enviadas"""
    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="event.id")
    user_id: int = Field(foreign_key="user.id")
    title: str
    body: str
    scheduled_for: datetime
    sent_at: Optional[datetime] = None
    status: str = Field(default="pending")  # pending, sent, failed
    notification_type: str  # "pre_event", "recurring_reminder", "multi_stage"
    stage: Optional[int] = None  # Para notificaciones multi-etapa (30d, 15d, etc.)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relaciones
    event: Event = Relationship(back_populates="notification_logs")

class TaskAssignmentHistory(SQLModel, table=True):
    """Historial de reasignaciones de tareas/eventos"""
    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="event.id")
    from_user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    to_user_id: int = Field(foreign_key="user.id")
    reassigned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reason: Optional[str] = None

class NotificationToken(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    token: str = Field(unique=True)
    device_type: str = Field(default="web")  # 'web', 'android', 'ios'
    device_info: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
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
    created_by_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    completed_by_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    # Notificaciones
    notification_config: Optional[str] = Field(default='{"pre": [15], "unit": "minutes"}')
    last_notified_at: Optional[datetime] = None

class ChatMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    family_id: int = Field(foreign_key="family.id")
    user_id: int = Field(foreign_key="user.id")
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))