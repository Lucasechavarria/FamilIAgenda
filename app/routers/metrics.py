from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func
from datetime import datetime, timedelta
from ..database import get_session
from ..security import get_current_user_id
from ..models import Event, FamilyMember, User

router = APIRouter()

@router.get("/metrics")
async def get_metrics(
    range: str = Query("month", regex="^(week|month|all)$"),
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """Obtiene métricas y estadísticas de eventos"""
    
    # Obtener family_id del usuario
    member = session.exec(
        select(FamilyMember).where(FamilyMember.user_id == user_id)
    ).first()
    
    if not member:
        return {
            "totalEvents": 0,
            "completedEvents": 0,
            "pendingEvents": 0,
            "eventsThisWeek": 0,
            "eventsThisMonth": 0,
            "categoryBreakdown": {},
            "memberStats": []
        }
    
    family_id = member.family_id
    
    # Calcular rangos de fecha
    now = datetime.now()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    # Query base
    base_query = select(Event).where(Event.family_id == family_id)
    
    # Aplicar filtro de rango
    if range == "week":
        base_query = base_query.where(Event.start_time >= week_ago)
    elif range == "month":
        base_query = base_query.where(Event.start_time >= month_ago)
    
    events = session.exec(base_query).all()
    
    # Calcular métricas
    total_events = len(events)
    completed_events = len([e for e in events if e.status == "completed"])
    pending_events = total_events - completed_events
    
    # Eventos esta semana
    events_this_week = len([
        e for e in events 
        if e.start_time >= week_ago
    ])
    
    # Eventos este mes
    events_this_month = len([
        e for e in events 
        if e.start_time >= month_ago
    ])
    
    # Distribución por categoría
    category_breakdown = {}
    for event in events:
        cat = event.category or "other"
        category_breakdown[cat] = category_breakdown.get(cat, 0) + 1
    
    # Estadísticas por miembro
    members = session.exec(
        select(User)
        .join(FamilyMember)
        .where(FamilyMember.family_id == family_id)
    ).all()
    
    member_stats = []
    for member_user in members:
        assigned_events = [e for e in events if e.assigned_to_id == member_user.id]
        completed = [e for e in assigned_events if e.status == "completed"]
        
        assigned_count = len(assigned_events)
        completed_count = len(completed)
        completion_rate = round((completed_count / assigned_count * 100)) if assigned_count > 0 else 0
        
        member_stats.append({
            "user_id": member_user.id,
            "user_name": member_user.full_name,
            "assigned_count": assigned_count,
            "completed_count": completed_count,
            "completion_rate": completion_rate
        })
    
    return {
        "totalEvents": total_events,
        "completedEvents": completed_events,
        "pendingEvents": pending_events,
        "eventsThisWeek": events_this_week,
        "eventsThisMonth": events_this_month,
        "categoryBreakdown": category_breakdown,
        "memberStats": member_stats
    }
