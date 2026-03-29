"""
Router de Búsqueda Global — Motor de búsqueda unificado para FamilIAgenda.

Permite buscar simultáneamente en Eventos, Tareas y Mensajes del Chat de la
familia del usuario autenticado. Los resultados se agrupan por tipo y se
ordenan por relevancia (coincidencia exacta primero) y fecha.

Uso:
    GET /api/search?q=dentista
    GET /api/search?q=reunión&types=events,tasks&limit=10
"""
from typing import Annotated, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, col, or_, select

from ..database import get_session
from ..dependencies import CurrentUser, DBSession
from ..models import ChatMessage, Event, FamilyMember, Task, User
from ..schemas import SearchResultItem, SearchResultsRead

router = APIRouter()

# Tipos permitidos de búsqueda
SearchType = Literal["events", "tasks", "chat"]


@router.get(
    "/",
    response_model=SearchResultsRead,
    summary="Búsqueda global de eventos, tareas y mensajes",
    description=(
        "Motor de búsqueda unificado que filtra simultáneamente Eventos, Tareas y Mensajes "
        "del Chat de la familia del usuario autenticado.\n\n"
        "**Parámetros:**\n"
        "- `q`: Término de búsqueda (mínimo 2 caracteres).\n"
        "- `types`: Tipos a incluir. Por defecto busca en todo: `events`, `tasks`, `chat`.\n"
        "- `limit`: Máximo de resultados por tipo (1-50, default 8).\n\n"
        "**Búsqueda:** Case-insensitive, coincidencia parcial en título, descripción y contenido.\n\n"
        "**Seguridad:** Solo retorna registros de la familia del usuario autenticado."
    ),
)
async def global_search(
    session: DBSession,
    current_user: CurrentUser,
    q: Annotated[
        str,
        Query(
            min_length=2,
            max_length=200,
            description="Término de búsqueda. Mínimo 2 caracteres.",
        ),
    ],
    types: Annotated[
        Optional[str],
        Query(
            description=(
                "Tipos a buscar, separados por coma. "
                "Valores válidos: `events`, `tasks`, `chat`. "
                "Por defecto: todos los tipos."
            ),
        ),
    ] = None,
    limit: Annotated[
        int,
        Query(ge=1, le=50, description="Máximo de resultados por tipo (1-50)."),
    ] = 8,
) -> SearchResultsRead:
    # ── Parsear tipos solicitados ────────────────────────────────────────────
    valid_types = {"events", "tasks", "chat"}
    if types:
        requested = {t.strip().lower() for t in types.split(",")}
        search_types = requested & valid_types  # Intersección: solo válidos
    else:
        search_types = valid_types

    # ── Obtener familia del usuario ──────────────────────────────────────────
    member = session.exec(
        select(FamilyMember).where(FamilyMember.user_id == current_user.id)
    ).first()

    if not member:
        # Usuario sin familia → resultados vacíos (no es error)
        return SearchResultsRead(
            query=q,
            total=0,
            events=[],
            tasks=[],
            chat=[],
        )

    family_id = member.family_id
    pattern = f"%{q}%"  # Patrón ilike para coincidencia parcial

    event_results: List[SearchResultItem] = []
    task_results: List[SearchResultItem] = []
    chat_results: List[SearchResultItem] = []

    # ── Buscar en Eventos ────────────────────────────────────────────────────
    if "events" in search_types:
        events = session.exec(
            select(Event)
            .where(Event.family_id == family_id)
            .where(
                or_(
                    col(Event.title).ilike(pattern),
                    col(Event.description).ilike(pattern),
                )
            )
            .order_by(col(Event.start_time).desc())
            .limit(limit)
        ).all()

        event_results = [
            SearchResultItem(
                id=e.id,
                type="event",
                title=e.title,
                subtitle=e.description,
                category=e.category,
                status=e.status,
                date=e.start_time,
                family_id=e.family_id,
            )
            for e in events
        ]

    # ── Buscar en Tareas ─────────────────────────────────────────────────────
    if "tasks" in search_types:
        tasks = session.exec(
            select(Task)
            .where(Task.family_id == family_id)
            .where(
                or_(
                    col(Task.title).ilike(pattern),
                    col(Task.description).ilike(pattern),
                )
            )
            .order_by(col(Task.due_date).desc())
            .limit(limit)
        ).all()

        task_results = [
            SearchResultItem(
                id=t.id,
                type="task",
                title=t.title,
                subtitle=t.description,
                category=t.priority,
                status=t.status,
                date=t.due_date,
                family_id=t.family_id,
            )
            for t in tasks
        ]

    # ── Buscar en Chat ───────────────────────────────────────────────────────
    if "chat" in search_types:
        chat_rows = session.exec(
            select(ChatMessage, User.full_name)
            .join(User, User.id == ChatMessage.user_id)  # type: ignore[arg-type]
            .where(ChatMessage.family_id == family_id)
            .where(col(ChatMessage.content).ilike(pattern))
            .order_by(col(ChatMessage.created_at).desc())
            .limit(limit)
        ).all()

        chat_results = [
            SearchResultItem(
                id=msg.id,
                type="chat",
                title=msg.content[:120] + ("…" if len(msg.content) > 120 else ""),
                subtitle=f"Enviado por {user_name}",
                category=None,
                status=None,
                date=msg.created_at,
                family_id=msg.family_id,
            )
            for msg, user_name in chat_rows
        ]

    total = len(event_results) + len(task_results) + len(chat_results)

    return SearchResultsRead(
        query=q,
        total=total,
        events=event_results,
        tasks=task_results,
        chat=chat_results,
    )
