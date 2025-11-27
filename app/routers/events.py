from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, or_

from ..database import get_session
from ..models import Event, FamilyMember, TaskAssignmentHistory, NotificationLog
from ..schemas import EventCreate, EventRead, EventUpdate
from ..security import get_current_user_id
from ..services.notification_scheduler import schedule_notifications_for_event, handle_recurring_event_completion
from datetime import datetime
from pydantic import BaseModel

router = APIRouter()

@router.post("/", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(
    event: EventCreate,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    # Validar si se asigna a una familia, que el usuario sea miembro
    if event.family_id:
        membership = session.exec(
            select(FamilyMember)
            .where(FamilyMember.family_id == event.family_id)
            .where(FamilyMember.user_id == user_id)
        ).first()
        if not membership:
            raise HTTPException(status_code=403, detail="No eres miembro de esta familia")

    db_event = Event.model_validate(event)
    db_event.owner_id = user_id
    # Si no se especifica familia, es privado por defecto (o personal)
    if not db_event.family_id:
        db_event.visibility = "private"
        
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    return db_event

@router.get("/", response_model=List[EventRead])
def read_events(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    # Obtener IDs de familias del usuario
    family_ids = session.exec(
        select(FamilyMember.family_id).where(FamilyMember.user_id == user_id)
    ).all()

    # Obtener IDs de eventos compartidos conmigo
    from ..models import EventShare
    shared_event_ids = session.exec(
        select(EventShare.event_id).where(EventShare.shared_with_user_id == user_id)
    ).all()

    # Query: Eventos donde soy owner O eventos de mis familias O eventos compartidos conmigo
    statement = select(Event).where(
        or_(
            Event.owner_id == user_id,
            Event.family_id.in_(family_ids), # type: ignore
            Event.id.in_(shared_event_ids) # type: ignore
        )
    ).offset(skip).limit(limit)
    
    events = session.exec(statement).all()
    return events

@router.get("/{event_id}", response_model=EventRead)
def read_event(
    event_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    # Verificar permisos
    # 1. Soy el dueño
    if event.owner_id == user_id:
        return event
    
    # 2. Es de una familia a la que pertenezco
    if event.family_id:
        membership = session.exec(
            select(FamilyMember)
            .where(FamilyMember.family_id == event.family_id)
            .where(FamilyMember.user_id == user_id)
        ).first()
        if membership:
            return event
            
    raise HTTPException(status_code=403, detail="No tienes permiso para ver este evento")

@router.patch("/{event_id}", response_model=EventRead)
def update_event(
    event_id: int,
    event_update: EventUpdate,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    from ..models import EventShare
    
    db_event = session.get(Event, event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    # Verificar permisos de edición
    can_edit = False
    
    # 1. Soy el dueño
    if db_event.owner_id == user_id:
        can_edit = True
    
    # 2. Está compartido conmigo con permiso de edición
    if not can_edit:
        share = session.exec(
            select(EventShare)
            .where(EventShare.event_id == event_id)
            .where(EventShare.shared_with_user_id == user_id)
            .where(EventShare.can_edit == True)
        ).first()
        if share:
            can_edit = True
    
    # 3. Es de una familia y soy admin/moderator
    if not can_edit and db_event.family_id:
        membership = session.exec(
            select(FamilyMember)
            .where(FamilyMember.family_id == db_event.family_id)
            .where(FamilyMember.user_id == user_id)
        ).first()
        if membership and membership.role in ["admin", "moderator"]:
            can_edit = True
    
    if not can_edit:
        raise HTTPException(status_code=403, detail="No tienes permiso para editar este evento")
    
    event_data = event_update.model_dump(exclude_unset=True)
    for key, value in event_data.items():
        setattr(db_event, key, value)
        
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    return db_event

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    db_event = session.get(Event, event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    # Verificar permisos de eliminación
    can_delete = False
    
    # 1. Soy el dueño
    if db_event.owner_id == user_id:
        can_delete = True
    
    # 2. Es de una familia y soy admin
    if not can_delete and db_event.family_id:
        membership = session.exec(
            select(FamilyMember)
            .where(FamilyMember.family_id == db_event.family_id)
            .where(FamilyMember.user_id == user_id)
        ).first()
        if membership and membership.role == "admin":
            can_delete = True
    
    if not can_delete:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este evento")
    
    session.delete(db_event)
    session.commit()
    return None

# Schemas para nuevos endpoints
class AssignEventRequest(BaseModel):
    assigned_to_id: int

class CompleteEventRequest(BaseModel):
    completed_by_id: Optional[int] = None

class NotificationConfigRequest(BaseModel):
    notification_config: str  # JSON string

# --- Nuevos Endpoints ---

@router.post("/{event_id}/assign", response_model=EventRead)
def assign_event(
    event_id: int,
    request: AssignEventRequest,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Asigna un evento a un usuario específico.
    Crea un registro en TaskAssignmentHistory.
    """
    db_event = session.get(Event, event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    # Verificar permisos (owner o admin de la familia)
    can_assign = False
    if db_event.owner_id == user_id:
        can_assign = True
    elif db_event.family_id:
        membership = session.exec(
            select(FamilyMember)
            .where(FamilyMember.family_id == db_event.family_id)
            .where(FamilyMember.user_id == user_id)
        ).first()
        if membership and membership.role in ["admin", "moderator"]:
            can_assign = True
    
    if not can_assign:
        raise HTTPException(status_code=403, detail="No tienes permiso para asignar este evento")
    
    # Verificar que el usuario asignado sea miembro de la familia
    if db_event.family_id:
        target_membership = session.exec(
            select(FamilyMember)
            .where(FamilyMember.family_id == db_event.family_id)
            .where(FamilyMember.user_id == request.assigned_to_id)
        ).first()
        if not target_membership:
            raise HTTPException(status_code=400, detail="El usuario no es miembro de esta familia")
    
    # Crear registro de historial
    history = TaskAssignmentHistory(
        event_id=event_id,
        from_user_id=db_event.assigned_to_id,
        to_user_id=request.assigned_to_id
    )
    session.add(history)
    
    # Actualizar asignación
    db_event.assigned_to_id = request.assigned_to_id
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    
    # Reprogramar notificaciones para el nuevo usuario
    schedule_notifications_for_event(session, event_id)
    
    return db_event

@router.post("/{event_id}/complete", response_model=EventRead)
def complete_event(
    event_id: int,
    request: CompleteEventRequest,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Marca un evento como completado.
    Si es recurrente, programa la próxima instancia.
    """
    db_event = session.get(Event, event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    # Verificar permisos (owner, assigned_to, o miembro de familia)
    can_complete = False
    if db_event.owner_id == user_id or db_event.assigned_to_id == user_id:
        can_complete = True
    elif db_event.family_id:
        membership = session.exec(
            select(FamilyMember)
            .where(FamilyMember.family_id == db_event.family_id)
            .where(FamilyMember.user_id == user_id)
        ).first()
        if membership:
            can_complete = True
    
    if not can_complete:
        raise HTTPException(status_code=403, detail="No tienes permiso para completar este evento")
    
    # Marcar como completado
    db_event.status = "completed"
    db_event.completed_at = datetime.utcnow()
    db_event.completed_by_id = request.completed_by_id or user_id
    
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    
    # Si es recurrente, crear próxima instancia
    if db_event.is_recurring:
        handle_recurring_event_completion(session, event_id)
    
    return db_event

@router.put("/{event_id}/notification-config", response_model=EventRead)
def update_notification_config(
    event_id: int,
    request: NotificationConfigRequest,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Actualiza la configuración de notificaciones de un evento.
    Reprograma las notificaciones pendientes.
    """
    db_event = session.get(Event, event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    # Verificar permisos (owner o assigned_to)
    if db_event.owner_id != user_id and db_event.assigned_to_id != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para configurar notificaciones")
    
    # Actualizar configuración
    db_event.notification_config = request.notification_config
    session.add(db_event)
    
    # Eliminar notificaciones pendientes antiguas
    old_notifications = session.exec(
        select(NotificationLog)
        .where(NotificationLog.event_id == event_id)
        .where(NotificationLog.sent_at == None)
    ).all()
    for notif in old_notifications:
        session.delete(notif)
    
    session.commit()
    session.refresh(db_event)
    
    # Reprogramar con nueva configuración
    schedule_notifications_for_event(session, event_id)
    
    return db_event

@router.get("/{event_id}/notification-history")
def get_notification_history(
    event_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Obtiene el historial de notificaciones de un evento.
    """
    db_event = session.get(Event, event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    # Verificar permisos
    if db_event.owner_id != user_id and db_event.assigned_to_id != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver este historial")
    
    notifications = session.exec(
        select(NotificationLog)
        .where(NotificationLog.event_id == event_id)
        .order_by(NotificationLog.scheduled_for)
    ).all()
    
    return {
        "event_id": event_id,
        "notifications": [
            {
                "id": n.id,
                "scheduled_for": n.scheduled_for,
                "sent_at": n.sent_at,
                "notification_type": n.notification_type,
                "stage": n.stage,
                "status": "sent" if n.sent_at else "pending"
            }
            for n in notifications
        ]
    }
