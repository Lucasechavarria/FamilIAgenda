"""
Router de Métricas — Dashboard de productividad y estadísticas familiares.

Proporciona un endpoint que agrega datos de eventos para generar métricas
visualizables en el dashboard de la aplicación.
"""
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query
from sqlmodel import select
from datetime import datetime, timedelta

from ..database import get_session
from ..dependencies import CurrentFamilyId, DBSession
from ..models import Event, FamilyMember, User
from ..schemas import MetricsRead, MemberStatRead
from ..security import get_current_user_id

router = APIRouter()


MetricsRange = Literal["week", "month", "all"]


@router.get(
    "/metrics",
    response_model=MetricsRead,
    summary="Obtener métricas del dashboard familiar",
    description=(
        "Retorna un resumen estadístico de la actividad familiar: total de eventos, "
        "tasa de completitud, distribución por categoría y productividad individual por miembro. "
        "Acepta el parámetro `range` para filtrar el período de análisis: "
        "`week` (últimos 7 días), `month` (últimos 30 días) o `all` (histórico completo). "
        "Si el usuario no pertenece a ninguna familia, retorna un objeto vacío con ceros."
    ),
)
async def get_metrics(
    session: DBSession,
    user_id: Annotated[int, Depends(get_current_user_id)],
    metrics_range: Annotated[
        MetricsRange,
        Query(
            alias="range",
            description="Período de análisis: `week` (7 días), `month` (30 días), `all` (histórico).",
        ),
    ] = "month",
):
    # Intentar obtener la familia, retornar vacío si no existe
    member = session.exec(
        select(FamilyMember).where(FamilyMember.user_id == user_id)
    ).first()

    if not member:
        return MetricsRead(
            totalEvents=0,
            completedEvents=0,
            pendingEvents=0,
            eventsThisWeek=0,
            eventsThisMonth=0,
            categoryBreakdown={},
            memberStats=[],
        )

    family_id = member.family_id

    # Calcular rangos de fecha
    now = datetime.now()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    # Query base filtrada por familia y rango seleccionado
    base_query = select(Event).where(Event.family_id == family_id)

    if metrics_range == "week":
        base_query = base_query.where(Event.start_time >= week_ago)
    elif metrics_range == "month":
        base_query = base_query.where(Event.start_time >= month_ago)

    events = session.exec(base_query).all()

    # Calcular métricas agregadas
    total_events = len(events)
    completed_events = sum(1 for e in events if e.status == "completed")
    pending_events = total_events - completed_events

    events_this_week = sum(1 for e in events if e.start_time >= week_ago)
    events_this_month = sum(1 for e in events if e.start_time >= month_ago)

    # Distribución por categoría
    category_breakdown: dict = {}
    for event in events:
        cat = event.category or "general"
        category_breakdown[cat] = category_breakdown.get(cat, 0) + 1

    # Estadísticas individuales por miembro
    members = session.exec(
        select(User)
        .join(FamilyMember)
        .where(FamilyMember.family_id == family_id)
    ).all()

    member_stats: list[MemberStatRead] = []
    for member_user in members:
        assigned = [e for e in events if e.assigned_to_id == member_user.id]
        completed = [e for e in assigned if e.status == "completed"]

        assigned_count = len(assigned)
        completed_count = len(completed)
        completion_rate = round(completed_count / assigned_count * 100, 2) if assigned_count > 0 else 0.0

        member_stats.append(
            MemberStatRead(
                user_id=member_user.id,
                user_name=member_user.full_name,
                assigned_count=assigned_count,
                completed_count=completed_count,
                completion_rate=completion_rate,
            )
        )

    return MetricsRead(
        totalEvents=total_events,
        completedEvents=completed_events,
        pendingEvents=pending_events,
        eventsThisWeek=events_this_week,
        eventsThisMonth=events_this_month,
        categoryBreakdown=category_breakdown,
        memberStats=member_stats,
    )
