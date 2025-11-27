"""
Servicio de programación y envío de notificaciones.
Maneja la lógica de notificaciones multi-etapa, recurrentes y asignaciones.
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import json
from sqlmodel import Session, select
from ..models import Event, NotificationLog, User, NotificationToken, Task
from ..notification_service import send_notification_to_user

def parse_notification_config(config_str: str) -> Dict[str, Any]:
    """
    Parsea el JSON de configuración de notificaciones.
    Ejemplos:
    - {"pre": [15], "unit": "minutes"} -> Notificar 15 min antes
    - {"stages": [30, 15, 7, 3, 1, 0], "unit": "days", "time": "09:00"} -> Multi-etapa
    """
    try:
        return json.loads(config_str)
    except:
        return {"pre": [15], "unit": "minutes"}

def parse_recurrence_pattern(pattern: str) -> Dict[str, Any]:
    """
    Parsea el patrón de recurrencia.
    Formato: "weekly:mon,wed,fri:22:00" o "daily:18:00"
    """
    parts = pattern.split(":")
    if len(parts) < 2:
        return {}
    
    freq = parts[0]  # daily, weekly, monthly
    
    if freq == "weekly" and len(parts) >= 3:
        days = parts[1].split(",")  # mon,wed,fri
        time = parts[2] if len(parts) > 2 else "00:00"
        return {"frequency": "weekly", "days": days, "time": time}
    elif freq == "daily":
        time = parts[1] if len(parts) > 1 else "00:00"
        return {"frequency": "daily", "time": time}
    
    return {}

def calculate_notification_times(event: Event) -> List[Dict[str, Any]]:
    """
    Calcula todos los momentos en que se deben enviar notificaciones para un evento.
    Retorna lista de dicts con {scheduled_for, notification_type, stage}
    """
    config = parse_notification_config(event.notification_config or "{}")
    notifications = []
    
    # Notificaciones multi-etapa (para eventos a largo plazo)
    if "stages" in config:
        stages = config["stages"]  # [30, 15, 7, 3, 1, 0]
        unit = config.get("unit", "days")
        time_str = config.get("time", "09:00")
        
        for stage in stages:
            if unit == "days":
                delta = timedelta(days=stage)
            elif unit == "hours":
                delta = timedelta(hours=stage)
            else:
                delta = timedelta(minutes=stage)
            
            # Calcular fecha/hora de notificación
            notification_date = event.start_time - delta
            
            # Ajustar hora si se especificó
            if time_str and unit == "days":
                hour, minute = map(int, time_str.split(":"))
                notification_date = notification_date.replace(hour=hour, minute=minute, second=0)
            
            notifications.append({
                "scheduled_for": notification_date,
                "notification_type": "multi_stage",
                "stage": stage
            })
    
    # Notificaciones simples (pre-evento)
    elif "pre" in config:
        pre_times = config["pre"]  # [15, 30]
        unit = config.get("unit", "minutes")
        
        for pre_time in pre_times:
            if unit == "minutes":
                delta = timedelta(minutes=pre_time)
            elif unit == "hours":
                delta = timedelta(hours=pre_time)
            else:
                delta = timedelta(days=pre_time)
            
            notifications.append({
                "scheduled_for": event.start_time - delta,
                "notification_type": "pre_event",
                "stage": None
            })
    
    return notifications

def schedule_notifications_for_event(session: Session, event_id: int):
    """
    Programa todas las notificaciones para un evento.
    Crea registros en NotificationLog para cada notificación pendiente.
    """
    event = session.get(Event, event_id)
    if not event:
        return
    
    # Determinar a quién notificar
    user_id = event.assigned_to_id or event.owner_id
    
    # Calcular momentos de notificación
    notification_times = calculate_notification_times(event)
    
    # Crear registros en NotificationLog
    for notif in notification_times:
        # Verificar que no exista ya
        existing = session.exec(
            select(NotificationLog).where(
                NotificationLog.event_id == event_id,
                NotificationLog.user_id == user_id,
                NotificationLog.scheduled_for == notif["scheduled_for"]
            )
        ).first()
        
        if not existing:
            log = NotificationLog(
                event_id=event_id,
                user_id=user_id,
                scheduled_for=notif["scheduled_for"],
                notification_type=notif["notification_type"],
                stage=notif["stage"]
            )
            session.add(log)
    
    session.commit()

def process_pending_notifications(session: Session):
    """
    Revisa NotificationLog y envía las notificaciones que ya deben enviarse.
    Debe ejecutarse periódicamente (cada 5 minutos).
    """
    now = datetime.utcnow()
    
    # Buscar notificaciones pendientes
    pending = session.exec(
        select(NotificationLog).where(
            NotificationLog.sent_at == None,
            NotificationLog.scheduled_for <= now
        )
    ).all()
    
    for notif_log in pending:
        try:
            # Obtener evento y usuario
            event = session.get(Event, notif_log.event_id)
            user = session.get(User, notif_log.user_id)
            
            if not event or not user:
                continue
            
            # Construir mensaje
            if notif_log.notification_type == "multi_stage":
                if notif_log.stage == 0:
                    title = f"¡Hoy! {event.title}"
                    body = f"El evento '{event.title}' es hoy a las {event.start_time.strftime('%H:%M')}"
                else:
                    title = f"Recordatorio: {event.title}"
                    body = f"Faltan {notif_log.stage} días para '{event.title}'"
            else:
                title = f"Recordatorio: {event.title}"
                body = f"'{event.title}' comienza pronto"
            
            # Enviar notificación
            send_notification_to_user(session, notif_log.user_id, title, body)
            
            # Marcar como enviada
            notif_log.sent_at = datetime.utcnow()
            session.add(notif_log)
            
        except Exception as e:
            print(f"Error enviando notificación {notif_log.id}: {e}")
    
    session.commit()

def handle_recurring_event_completion(session: Session, event_id: int):
    """
    Cuando se marca un evento recurrente como completado:
    1. Marca la instancia actual como completada
    2. Calcula la próxima instancia
    3. Programa notificaciones para la próxima instancia
    """
    event = session.get(Event, event_id)
    if not event or not event.is_recurring:
        return
    
    # Parsear patrón de recurrencia
    pattern = parse_recurrence_pattern(event.recurrence_pattern or "")
    if not pattern:
        return
    
    # Calcular próxima ocurrencia
    next_start = calculate_next_occurrence(event.start_time, pattern)
    if not next_start:
        return
    
    # Crear nueva instancia (clonar evento)
    duration = event.end_time - event.start_time
    new_event = Event(
        title=event.title,
        description=event.description,
        start_time=next_start,
        end_time=next_start + duration,
        category=event.category,
        priority=event.priority,
        visibility=event.visibility,
        is_recurring=True,
        recurrence_pattern=event.recurrence_pattern,
        notification_config=event.notification_config,
        assigned_to_id=event.assigned_to_id,
        owner_id=event.owner_id,
        family_id=event.family_id
    )
    
    session.add(new_event)
    session.commit()
    session.refresh(new_event)
    
    # Programar notificaciones para la nueva instancia
    schedule_notifications_for_event(session, new_event.id)

def calculate_next_occurrence(current_start: datetime, pattern: Dict[str, Any]) -> Optional[datetime]:
    """
    Calcula la próxima ocurrencia basada en el patrón de recurrencia.
    """
    freq = pattern.get("frequency")
    
    if freq == "daily":
        return current_start + timedelta(days=1)
    
    elif freq == "weekly":
        days_map = {
            "mon": 0, "tue": 1, "wed": 2, "thu": 3,
            "fri": 4, "sat": 5, "sun": 6
        }
        target_days = [days_map.get(d.lower(), 0) for d in pattern.get("days", [])]
        
        if not target_days:
            return None
        
        # Encontrar el próximo día válido
        current_weekday = current_start.weekday()
        next_day = None
        
        for offset in range(1, 8):
            check_day = (current_weekday + offset) % 7
            if check_day in target_days:
                next_day = current_start + timedelta(days=offset)
                break
        
        if next_day and "time" in pattern:
            hour, minute = map(int, pattern["time"].split(":"))
            next_day = next_day.replace(hour=hour, minute=minute, second=0)
        
        return next_day
    
    return None

def send_notification_to_user(session: Session, user_id: int, title: str, body: str):
    """
    Envía notificación a un usuario específico.
    Busca todos los tokens del usuario y envía a cada dispositivo.
    """
    from .notification_service import send_notification_to_family
    from firebase_admin import messaging
    
    # Obtener tokens del usuario
    tokens = session.exec(
        select(NotificationToken).where(NotificationToken.user_id == user_id)
    ).all()
    
    if not tokens:
        return
    
    registration_tokens = [t.token for t in tokens]
    
    try:
        message = messaging.MulticastMessage(
            notification=messaging.Notification(title=title, body=body),
            tokens=registration_tokens,
        )
        response = messaging.send_multicast(message)
        print(f"Notificaciones enviadas a usuario {user_id}: {response.success_count}/{len(registration_tokens)}")
    except Exception as e:
        print(f"Error enviando notificación a usuario {user_id}: {e}")
