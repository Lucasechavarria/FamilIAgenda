"""
Schemas de validación y serialización de la API FamilIAgenda.

Este módulo define todos los modelos Pydantic usados como contratos de entrada
y salida de la API. Se usan `Annotated` para metadatos de validación y
`Literal` para restricción de valores de enumeración, garantizando tipado
estricto en toda la capa de API.

Convención de nomenclatura:
    - `*Base`   → campos comunes compartidos por Create y Read
    - `*Create` → schema de entrada (POST/PUT body)
    - `*Update` → schema de actualización parcial (PATCH body), todos Optional
    - `*Read`   → schema de salida (response_model)
"""
from __future__ import annotations

from datetime import datetime
from typing import Annotated, List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field


# =============================================================================
# ── AUTENTICACIÓN ─────────────────────────────────────────────────────────────
# =============================================================================

class UserRegister(BaseModel):
    """Datos necesarios para registrar un nuevo usuario."""

    email: Annotated[EmailStr, Field(description="Correo electrónico único del usuario.")]
    password: Annotated[
        str,
        Field(min_length=8, description="Contraseña en texto plano (mínimo 8 caracteres)."),
    ]
    full_name: Annotated[
        str,
        Field(min_length=2, max_length=100, description="Nombre completo del usuario."),
    ]
    family_name: Annotated[
        str,
        Field(default="", description="Nombre de la familia a crear o unirse. Opcional."),
    ]


class UserLogin(BaseModel):
    """Credenciales para autenticación de un usuario existente."""

    email: Annotated[EmailStr, Field(description="Correo electrónico registrado.")]
    password: Annotated[str, Field(description="Contraseña en texto plano.")]


class Token(BaseModel):
    """Respuesta de autenticación exitosa con JWT."""

    access_token: Annotated[str, Field(description="JSON Web Token de acceso.")]
    token_type: Annotated[
        Literal["bearer"],
        Field(default="bearer", description="Tipo de token (siempre 'bearer')."),
    ]
    user_name: Annotated[str, Field(description="Nombre completo del usuario autenticado.")]
    user_email: Annotated[str, Field(description="Email del usuario autenticado.")]
    family_id: Annotated[Optional[int], Field(default=None, description="ID de la familia del usuario.")]
    points: Annotated[int, Field(default=0, description="Puntos totales del usuario.")]
    level: Annotated[int, Field(default=1, description="Nivel actual del usuario.")]


# =============================================================================
# ── USUARIO ───────────────────────────────────────────────────────────────────
# =============================================================================

class UserRead(BaseModel):
    """Representación pública de un usuario (sin datos sensibles)."""

    id: int
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    points: int = 0
    level: int = 1
    level_name: str = "Aprendiz del Orden"
    theme: str = "space"
    color: Annotated[
        str,
        Field(
            default="#3B82F6",
            pattern=r"^#[0-9A-Fa-f]{6}$",
            description="Color hexadecimal personal para identificación visual (#RRGGBB).",
        ),
    ]


class UserUpdate(BaseModel):
    """Campos actualizables del perfil de usuario."""

    full_name: Annotated[
        Optional[str],
        Field(default=None, min_length=2, max_length=100),
    ]
    avatar_url: Optional[str] = None
    color: Annotated[
        Optional[str],
        Field(
            default=None,
            pattern=r"^#[0-9A-Fa-f]{6}$",
            description="Color hexadecimal en formato #RRGGBB.",
        ),
    ]
    theme: Optional[str] = None
    kanban_layout: Optional[str] = None


class FamilyMemberRead(BaseModel):
    """Miembro de una familia con su información básica y color."""

    id: int
    full_name: str
    email: str
    avatar_url: Optional[str] = None
    color: str
    points: int = 0
    level: int = 1
    level_name: str = "Aprendiz del Orden"


# =============================================================================
# ── FAMILIA ───────────────────────────────────────────────────────────────────
# =============================================================================

class FamilyCreate(BaseModel):
    """Datos para crear una nueva familia."""

    name: Annotated[
        str,
        Field(min_length=2, max_length=80, description="Nombre de la familia."),
    ]


class FamilyRead(BaseModel):
    """Información de una familia (incluye el código de invitación)."""

    id: int
    name: str
    invitation_code: Annotated[
        str,
        Field(description="Código alfanumérico de 8 caracteres para invitar miembros."),
    ]


class JoinFamily(BaseModel):
    """Solicitud para unirse a una familia existente mediante código."""

    invitation_code: Annotated[
        str,
        Field(min_length=8, max_length=8, description="Código de invitación de 8 caracteres."),
    ]


# =============================================================================
# ── EVENTOS ───────────────────────────────────────────────────────────────────
# =============================================================================

EventCategory = Literal["general", "home", "school", "work", "health"]
EventPriority = Literal["low", "normal", "high", "critical"]
EventVisibility = Literal["private", "family"]
EventStatus = Literal["pending", "in_progress", "completed", "cancelled"]


class EventBase(BaseModel):
    """Campos base compartidos por EventCreate y EventRead."""

    title: Annotated[
        str,
        Field(min_length=1, max_length=200, description="Título descriptivo del evento."),
    ]
    description: Annotated[
        Optional[str],
        Field(default=None, max_length=2000, description="Descripción detallada del evento."),
    ]
    start_time: Annotated[datetime, Field(description="Fecha y hora de inicio (UTC).")]
    end_time: Annotated[datetime, Field(description="Fecha y hora de fin (UTC).")]
    category: Annotated[
        EventCategory,
        Field(default="general", description="Categoría del evento."),
    ]
    priority: Annotated[
        EventPriority,
        Field(default="normal", description="Nivel de prioridad del evento."),
    ]
    visibility: Annotated[
        EventVisibility,
        Field(default="family", description="Visibilidad del evento."),
    ]
    visibility_type: Annotated[
        Literal["invisible", "busy"],
        Field(default="invisible", description="Cómo se muestra si es privado (invisible o ocupado)."),
    ]
    is_recurring: Annotated[
        bool,
        Field(default=False, description="Indica si el evento se repite periódicamente."),
    ]
    recurrence_pattern: Annotated[
        Optional[str],
        Field(
            default=None,
            description="Patrón de recurrencia en formato iCal RRULE (ej: 'FREQ=WEEKLY;BYDAY=MO,WE').",
        ),
    ]
    assigned_to_id: Annotated[
        Optional[int],
        Field(default=None, description="ID del miembro de la familia asignado al evento."),
    ]
    family_id: Annotated[
        Optional[int],
        Field(default=None, description="ID de la familia propietaria del evento."),
    ]
    parent_id: Annotated[
        Optional[int],
        Field(default=None, description="ID del evento padre en una serie recurrente."),
    ]


class EventCreate(EventBase):
    """Datos requeridos para crear un nuevo evento."""
    pass


class EventRead(EventBase):
    """Representación completa de un evento (incluye campos de servidor)."""

    id: int
    owner_id: Annotated[
        Optional[int],
        Field(description="ID del usuario creador del evento."),
    ]
    status: Annotated[
        EventStatus,
        Field(default="pending", description="Estado actual del evento."),
    ]
    completed_at: Optional[datetime] = None
    completed_by_id: Optional[int] = None
    notification_config: Optional[str] = None

    model_config = {"from_attributes": True}


class EventUpdate(BaseModel):
    """Campos actualizables de un evento (todos opcionales para PATCH)."""

    title: Annotated[Optional[str], Field(default=None, max_length=200)]
    description: Annotated[Optional[str], Field(default=None, max_length=2000)]
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    category: Optional[EventCategory] = None
    priority: Optional[EventPriority] = None
    visibility: Optional[EventVisibility] = None
    status: Optional[EventStatus] = None


# ── Schemas de acciones sobre eventos ────────────────────────────────────────

class AssignEventRequest(BaseModel):
    """Solicitud para asignar un evento a un miembro de la familia."""

    assigned_to_id: Annotated[
        int,
        Field(description="ID del usuario al que se asigna el evento."),
    ]


class CompleteEventRequest(BaseModel):
    """Solicitud para marcar un evento como completado."""

    completed_by_id: Annotated[
        Optional[int],
        Field(
            default=None,
            description="ID del usuario que completó el evento. Si no se especifica, se usa el usuario autenticado.",
        ),
    ]


class NotificationConfigRequest(BaseModel):
    """Solicitud para actualizar la configuración de notificaciones de un evento."""

    notification_config: Annotated[
        str,
        Field(
            description='JSON string con la configuración. Ej: \'{"pre": [15, 60], "post": false}\'',
        ),
    ]


# =============================================================================
# ── TAREAS ────────────────────────────────────────────────────────────────────
# =============================================================================

TaskPriority = Literal["low", "normal", "high", "critical"]
TaskStatus = Literal["pending", "in_progress", "completed", "cancelled"]


class TaskBase(BaseModel):
    """Campos base compartidos por TaskCreate y TaskRead."""

    title: Annotated[
        str,
        Field(min_length=1, max_length=200, description="Título de la tarea."),
    ]
    description: Annotated[
        Optional[str],
        Field(default=None, max_length=2000, description="Descripción detallada de la tarea."),
    ]
    category: Annotated[
        str,
        Field(default="tasks", description="Categoría de la tarea."),
    ]
    due_date: Annotated[
        Optional[datetime],
        Field(default=None, description="Fecha límite de la tarea (UTC)."),
    ]
    priority: Annotated[
        TaskPriority,
        Field(default="normal", description="Nivel de prioridad de la tarea."),
    ]
    assigned_to_id: Annotated[
        Optional[int],
        Field(default=None, description="ID del miembro de la familia asignado a la tarea."),
    ]
    notification_config: Annotated[
        Optional[str],
        Field(
            default='{"pre": [15], "unit": "minutes"}',
            description='JSON string con la configuración de notificaciones.',
        ),
    ]
    is_recurring: Annotated[
        bool,
        Field(default=False, description="Indica si la tarea se repite."),
    ]
    recurrence_pattern: Annotated[
        Optional[str],
        Field(default=None, description="Patrón de recurrencia RFC 5545."),
    ]
    parent_id: Annotated[
        Optional[int],
        Field(default=None, description="ID de la tarea padre en una serie recurrente."),
    ]


class TaskCreate(TaskBase):
    """Datos requeridos para crear una nueva tarea."""
    pass


class TaskRead(TaskBase):
    """Representación completa de una tarea (incluye campos de servidor)."""

    id: int
    family_id: int
    created_by_id: int
    status: Annotated[TaskStatus, Field(default="pending")]
    completed_at: Optional[datetime] = None
    completed_by_id: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TaskUpdate(BaseModel):
    """Campos actualizables de una tarea (todos opcionales para PATCH)."""

    title: Annotated[Optional[str], Field(default=None, max_length=200)]
    description: Annotated[Optional[str], Field(default=None, max_length=2000)]
    due_date: Optional[datetime] = None
    assigned_to_id: Optional[int] = None
    priority: Optional[TaskPriority] = None
    category: Optional[str] = None
    status: Optional[TaskStatus] = None
    is_recurring: Optional[bool] = None
    recurrence_pattern: Optional[str] = None
    parent_id: Optional[int] = None
    notification_config: Optional[str] = None


# =============================================================================
# ── CHAT ──────────────────────────────────────────────────────────────────────
# =============================================================================

class MessageCreate(BaseModel):
    """Datos para enviar un nuevo mensaje al chat familiar."""

    content: Annotated[
        str,
        Field(min_length=1, max_length=4000, description="Contenido del mensaje."),
    ]


class MessageRead(BaseModel):
    """Representación de un mensaje del chat familiar."""

    id: int
    family_id: int
    user_id: int
    content: str
    created_at: datetime
    user_name: Annotated[
        Optional[str],
        Field(default=None, description="Nombre del autor para visualización en UI."),
    ]

    model_config = {"from_attributes": True}


# =============================================================================
# ── INTELIGENCIA ARTIFICIAL ──────────────────────────────────────────────────
# =============================================================================

class PromptUsuario(BaseModel):
    """Solicitud de interpretación de texto natural por IA."""

    texto: Annotated[
        str,
        Field(
            min_length=5,
            max_length=1000,
            description='Texto en lenguaje natural. Ej: "Reunión con el colegio el viernes a las 3pm".',
        ),
    ]


# =============================================================================
# ── NOTIFICACIONES ───────────────────────────────────────────────────────────
# =============================================================================

DeviceType = Literal["web", "android", "ios"]


class TokenRegistration(BaseModel):
    """Datos para registrar un token de notificación push (FCM)."""

    token: Annotated[
        str,
        Field(min_length=10, description="Token FCM del dispositivo."),
    ]
    device_type: Annotated[
        DeviceType,
        Field(default="web", description="Tipo de dispositivo que registra el token."),
    ]
    device_info: Annotated[
        Optional[str],
        Field(default=None, description="Información adicional del dispositivo (user-agent, modelo, etc.)."),
    ]


# =============================================================================
# ── MÉTRICAS ─────────────────────────────────────────────────────────────────
# =============================================================================

class MemberStatRead(BaseModel):
    """Estadísticas de productividad de un miembro de la familia."""

    user_id: int
    user_name: str
    assigned_count: Annotated[int, Field(description="Total de eventos asignados al miembro.")]
    completed_count: Annotated[int, Field(description="Total de eventos completados por el miembro.")]
    completion_rate: Annotated[
        float,
        Field(ge=0.0, le=100.0, description="Porcentaje de completitud (0-100)."),
    ]
    points: Annotated[int, Field(default=0, description="Puntos acumulados por el miembro.")]
    level: Annotated[int, Field(default=1, description="Nivel del miembro.")]
    level_name: Annotated[str, Field(default="Aprendiz del Orden", description="Título divertido del nivel.")]


class MetricsRead(BaseModel):
    """Dashboard de métricas y estadísticas de la familia."""

    totalEvents: Annotated[int, Field(description="Total de eventos en el rango seleccionado.")]
    completedEvents: Annotated[int, Field(description="Eventos completados.")]
    pendingEvents: Annotated[int, Field(description="Eventos pendientes.")]
    eventsThisWeek: Annotated[int, Field(description="Eventos en los últimos 7 días.")]
    eventsThisMonth: Annotated[int, Field(description="Eventos en los últimos 30 días.")]
    categoryBreakdown: Annotated[
        dict,
        Field(description="Distribución de eventos por categoría. Clave: categoría, Valor: cantidad."),
    ]
    memberStats: Annotated[
        List[MemberStatRead],
        Field(description="Estadísticas individuales por miembro de la familia."),
    ]


# =============================================================================
# ── COMPARTIR EVENTOS ────────────────────────────────────────────────────────
# =============================================================================

class EventShareCreate(BaseModel):
    """Datos para compartir un evento con otro usuario."""

    shared_with_user_id: Annotated[
        int,
        Field(description="ID del usuario con quien compartir el evento."),
    ]
    can_edit: Annotated[
        bool,
        Field(default=False, description="Indica si el usuario compartido puede editar el evento."),
    ]


class EventShareRead(BaseModel):
    """Representación de un evento compartido."""

    id: int
    event_id: int
    shared_with_user_id: int
    can_edit: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# =============================================================================
# ── BÚSQUEDA GLOBAL ──────────────────────────────────────────────────────────
# =============================================================================

SearchResultType = Literal["event", "task", "chat"]


class SearchResultItem(BaseModel):
    """Un ítem individual en los resultados de búsqueda global."""

    id: int
    type: Annotated[
        SearchResultType,
        Field(description="Tipo de entidad encontrada: 'event', 'task' o 'chat'."),
    ]
    title: Annotated[
        str,
        Field(description="Título o contenido principal del resultado."),
    ]
    subtitle: Annotated[
        Optional[str],
        Field(default=None, description="Información secundaria (descripción, fecha, autor)."),
    ]
    category: Annotated[
        Optional[str],
        Field(default=None, description="Categoría del evento o prioridad de la tarea."),
    ]
    status: Annotated[
        Optional[str],
        Field(default=None, description="Estado actual (pending, completed, etc.)."),
    ]
    date: Annotated[
        Optional[datetime],
        Field(default=None, description="Fecha relevante del ítem (inicio del evento, vencimiento de tarea, creación del mensaje)."),
    ]
    family_id: Annotated[
        Optional[int],
        Field(default=None, description="ID de la familia propietaria del ítem."),
    ]

    model_config = {"from_attributes": True}


class SearchResultsRead(BaseModel):
    """Respuesta completa del motor de búsqueda global."""

    query: Annotated[str, Field(description="Término de búsqueda utilizado.")]
    total: Annotated[int, Field(description="Total de resultados encontrados.")]
    events: Annotated[
        List[SearchResultItem],
        Field(default_factory=list, description="Resultados del tipo 'evento'."),
    ]
    tasks: Annotated[
        List[SearchResultItem],
        Field(default_factory=list, description="Resultados del tipo 'tarea'."),
    ]
    chat: Annotated[
        List[SearchResultItem],
        Field(default_factory=list, description="Resultados del tipo 'mensaje de chat'."),
    ]

