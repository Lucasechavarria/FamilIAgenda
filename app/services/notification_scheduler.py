"""
Servicio de programación y envío de notificaciones.
Maneja la lógica de notificaciones multi-etapa, recurrentes y asignaciones.
"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
import json
from sqlmodel import Session, select, delete
from app.models import Event, NotificationLog, User, NotificationToken, Task
from dateutil import rrule
from dateutil.parser import parse as parse_date

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
    now = datetime.now(timezone.utc)
    
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
            notif_log.sent_at = datetime.now(timezone.utc)
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

def pre_generate_recurring_instances(session: Session, event_id: int, weeks_ahead: int = 4):
    """
    Pre-genera instancias futuras de un evento recurrente para que el usuario 
    pueda ver su horario completo (ej: colegio) de inmediato.
    """
    event = session.get(Event, event_id)
    if not event or not event.is_recurring or not event.recurrence_pattern:
        return

    # Evitar duplicados: borrar instancias futuras no completadas de este padre
    now = datetime.now(timezone.utc)
    session.exec(
        delete(Event)
        .where(Event.parent_id == event_id)
        .where(Event.status == "pending")
        .where(Event.start_time > now)
    )
    
    # Calcular fechas usando rrule
    try:
        # El patrón puede ser RRULE puro o nuestro formato custom
        rule_str = event.recurrence_pattern
        if "FREQ=" not in rule_str.upper():
            # Convertir formato custom a RRULE básico para compatibilidad
            pattern = parse_recurrence_pattern(rule_str)
            if pattern.get("frequency") == "daily":
                rule_str = "FREQ=DAILY"
            elif pattern.get("frequency") == "weekly":
                days = ",".join([d[:2].upper() for d in pattern.get("days", [])])
                rule_str = f"FREQ=WEEKLY;BYDAY={days}"

        rule = rrule.rrulestr(rule_str, dtstart=event.start_time)
        
        # Ventana de pre-generación:
        # Si el RRULE tiene UNTIL, usamos esa fecha.
        # Si no, usamos 6 meses (26 semanas) por defecto para soportar ciclos escolares/largos.
        if "UNTIL=" in rule_str.upper():
            # Extraer fecha UNTIL si es posible, o dejar que rule.between maneje el límite
            # Por seguridad limitamos a 1 año máximo de pre-generación.
            until_limit = now + timedelta(weeks=52)
        else:
            until_limit = now + timedelta(weeks=26)
            
        occurrences = rule.between(event.start_time, until_limit, inc=False)
        
        duration = event.end_time - event.start_time
        
        for occ in occurrences:
            # Asegurar timezone
            occ = occ.replace(tzinfo=timezone.utc)
            
            new_instance = Event(
                title=event.title,
                description=event.description,
                start_time=occ,
                end_time=occ + duration,
                category=event.category,
                priority=event.priority,
                visibility=event.visibility,
                visibility_type=event.visibility_type,
                is_recurring=True,
                recurrence_pattern=event.recurrence_pattern,
                notification_config=event.notification_config,
                assigned_to_id=event.assigned_to_id,
                owner_id=event.owner_id,
                family_id=event.family_id,
                parent_id=event_id
            )
            session.add(new_instance)
            
        session.commit()
        # Nota: schedule_notifications_for_event se llamará bajo demanda o en batch
        
    except Exception as e:
        print(f"Error pre-generando eventos: {e}")

def pre_generate_recurring_tasks(session: Session, task_id: int, weeks_ahead: int = 4):
    """
    Pre-genera instancias futuras de una tarea recurrente.
    """
    task = session.get(Task, task_id)
    if not task or not task.is_recurring or not task.recurrence_pattern:
        return

    # Borrar futuras pendientes para evitar duplicados
    now = datetime.now(timezone.utc)
    session.exec(
        delete(Task)
        .where(Task.parent_id == task_id)
        .where(Task.status == "pending")
        .where(Task.due_date > now)
    )
    
    try:
        rule_str = task.recurrence_pattern
        rule = rrule.rrulestr(rule_str, dtstart=task.due_date)
        
        if "UNTIL=" in rule_str.upper():
            until_limit = now + timedelta(weeks=52)
        else:
            until_limit = now + timedelta(weeks=26)
            
        occurrences = rule.between(task.due_date, until_limit, inc=False)
        
        for occ in occurrences:
            occ = occ.replace(tzinfo=timezone.utc)
            new_instance = Task(
                title=task.title,
                description=task.description,
                due_date=occ,
                priority=task.priority,
                status="pending",
                category=task.category,
                assigned_to_id=task.assigned_to_id,
                family_id=task.family_id,
                created_by_id=task.created_by_id,
                is_recurring=True,
                recurrence_pattern=task.recurrence_pattern,
                parent_id=task_id,
                notification_config=task.notification_config
            )
            session.add(new_instance)
        session.commit()
    except Exception as e:
        print(f"Error pre-generando tareas: {e}")

def calculate_next_occurrence(current_start: datetime, pattern_str: str) -> Optional[datetime]:
    """
    Calcula la próxima ocurrencia usando dateutil.rrule.
    """
    try:
        if "FREQ=" in pattern_str.upper():
            rule = rrule.rrulestr(pattern_str, dtstart=current_start)
            return rule.after(current_start)
        else:
            # Fallback legacy
            pattern = parse_recurrence_pattern(pattern_str)
            freq = pattern.get("frequency")
            if freq == "daily":
                return current_start + timedelta(days=1)
            elif freq == "weekly":
                # Lógica simplificada
                days_map = {"mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6}
                target_days = [days_map.get(d.lower(), 0) for d in pattern.get("days", [])]
                for offset in range(1, 8):
                    if (current_start.weekday() + offset) % 7 in target_days:
                        return current_start + timedelta(days=offset)
    except:
        return None
    return None

def send_notification_to_user(session: Session, user_id: int, title: str, body: str):
    """
    Envía notificación a un usuario específico.
    Busca todos los tokens del usuario y envía a cada dispositivo.
    """
    try:
        from firebase_admin import messaging
    except ImportError:
        print("Firebase Admin SDK no está disponible")
        return
    
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

def notify_missed_tasks(session: Session):
    """
    Busca tareas que han vencido (pending y due_date < now) y envía notificación al asignado.
    Evita enviar duplicados usando un flag o registro.
    """
    now = datetime.now(timezone.utc)
    # Tareas vencidas hace menos de 1 hora (para no inundar si se corre frecuentemente)
    missed = session.exec(
        select(Task).where(
            Task.status == "pending",
            Task.due_date < now,
            Task.due_date > now - timedelta(hours=1)
        )
    ).all()
    
    for task in missed:
        user_id = task.assigned_to_id or task.created_by_id
        if user_id:
            title = f"Tarea pendiente: {task.title}"
            body = f"La tarea '{task.title}' venció a las {task.due_date.strftime('%H:%M')}. ¡No olvides completarla!"
            send_notification_to_user(session, user_id, title, body)

def send_daily_missed_tasks_summary(session: Session):
    """
    Envía un resumen diario (ej: 8:00 PM) de todas las tareas pendientes del día.
    """
    now = datetime.now(timezone.utc)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Obtener todas las tareas pendientes hoy
    missed = session.exec(
        select(Task).where(
            Task.status == "pending",
            Task.due_date < now,
            Task.due_date >= start_of_day
        )
    ).all()
    
    # Agrupar por usuario
    user_tasks: dict[int, list[str]] = {}
    for task in missed:
        uid = task.assigned_to_id or task.created_by_id
        if uid:
            if uid not in user_tasks: user_tasks[uid] = []
            user_tasks[uid].append(task.title)
        
    for user_id, titles in user_tasks.items():
        title = "Resumen de tareas no realizadas"
        body = f"Tienes {len(titles)} tareas pendientes de hoy: {', '.join(titles[:3])}{'...' if len(titles) > 3 else ''}"
        send_notification_to_user(session, user_id, title, body)
