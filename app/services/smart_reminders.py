"""
Servicio de recordatorios inteligentes usando IA.
Analiza patrones de eventos y sugiere recordatorios óptimos.
"""
from datetime import datetime, timedelta, timezone
from typing import Dict, List
from sqlmodel import Session, select
from ..models import Event, User, NotificationToken
from ..notification_service import send_notification_to_family

def calculate_smart_reminder_time(event: Event) -> List[datetime]:
    """
    Calcula los mejores momentos para enviar recordatorios basándose en:
    - Tipo de evento (categoría)
    - Duración
    - Hora del día
    
    Returns:
        Lista de timestamps cuando enviar recordatorios
    """
    reminders = []
    event_start = event.start_time
    
    # Recordatorio base según categoría
    category_reminders = {
        "work": [timedelta(hours=24), timedelta(hours=1)],  # 1 día antes y 1 hora antes
        "health": [timedelta(hours=48), timedelta(hours=3)],  # 2 días y 3 horas antes
        "school": [timedelta(hours=24), timedelta(hours=2)],
        "leisure": [timedelta(hours=12)],  # Solo 12 horas antes
        "general": [timedelta(hours=24), timedelta(minutes=30)]
    }
    
    deltas = category_reminders.get(event.category, category_reminders["general"])
    
    for delta in deltas:
        reminder_time = event_start - delta
        # Solo añadir si es en el futuro
        if reminder_time > datetime.now(timezone.utc):
            reminders.append(reminder_time)
    
    return reminders

def analyze_productivity_patterns(session: Session, user_id: int) -> Dict[str, any]:
    """
    Analiza los eventos pasados del usuario para identificar patrones:
    - Horas más productivas
    - Días con más eventos
    - Categorías más frecuentes
    """
    # Obtener eventos de los últimos 30 días
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    events = session.exec(
        select(Event)
        .where(Event.owner_id == user_id)
        .where(Event.start_time >= thirty_days_ago)
        .where(Event.start_time <= datetime.now(timezone.utc))
    ).all()
    
    if not events:
        return {
            "peak_hours": [9, 10, 14, 15],  # Default: mañana y tarde
            "busiest_days": ["Monday", "Tuesday", "Wednesday"],
            "top_categories": ["general"]
        }
    
    # Análisis de horas
    hours_count = {}
    for event in events:
        hour = event.start_time.hour
        hours_count[hour] = hours_count.get(hour, 0) + 1
    
    peak_hours = sorted(hours_count.keys(), key=lambda h: hours_count[h], reverse=True)[:4]
    
    # Análisis de días
    days_count = {}
    for event in events:
        day = event.start_time.strftime("%A")
        days_count[day] = days_count.get(day, 0) + 1
    
    busiest_days = sorted(days_count.keys(), key=lambda d: days_count[d], reverse=True)[:3]
    
    # Análisis de categorías
    categories_count = {}
    for event in events:
        categories_count[event.category] = categories_count.get(event.category, 0) + 1
    
    top_categories = sorted(categories_count.keys(), key=lambda c: categories_count[c], reverse=True)[:3]
    
    return {
        "peak_hours": peak_hours,
        "busiest_days": busiest_days,
        "top_categories": top_categories
    }

def send_smart_reminder(session: Session, event: Event):
    """
    Envía un recordatorio inteligente considerando:
    - Tiempo de viaje (futuro: integración con Google Maps)
    - Clima (futuro)
    - Tráfico (futuro)
    """
    if not event.family_id:
        return
    
    # Por ahora, enviar recordatorio simple
    title = f"Recordatorio: {event.title}"
    
    # Calcular tiempo hasta el evento
    time_until = event.start_time - datetime.now(timezone.utc)
    hours = int(time_until.total_seconds() / 3600)
    minutes = int((time_until.total_seconds() % 3600) / 60)
    
    if hours > 0:
        body = f"Tu evento comienza en {hours}h {minutes}min"
    else:
        body = f"Tu evento comienza en {minutes} minutos"
    
    # Añadir sugerencias según categoría
    if event.category == "health":
        body += ". Recuerda llevar tu documentación médica."
    elif event.category == "work":
        body += ". Prepara los materiales necesarios."
    
    send_notification_to_family(session, event.family_id, title, body)
