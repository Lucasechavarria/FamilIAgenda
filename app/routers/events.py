"""
Router de Eventos — CRUD completo con control de permisos.

Todos los endpoints requieren autenticación JWT (Bearer token). Los usuarios
solo pueden ver y gestionar eventos de sus familias o eventos propios.
"""
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, or_

from ..database import get_session
from ..dependencies import CurrentUser, CurrentFamilyId, DBSession
from ..models import Event, EventShare, FamilyMember, NotificationLog, TaskAssignmentHistory
from ..schemas import (
    AssignEventRequest,
    CompleteEventRequest,
    EventCreate,
    EventRead,
    EventUpdate,
    NotificationConfigRequest,
)
from ..security import get_current_user_id
from ..services.notification_scheduler import (
    handle_recurring_event_completion,
    schedule_notifications_for_event,
)
from datetime import datetime, timezone

router = APIRouter()


# =============================================================================
# ── CRUD Base ─────────────────────────────────────────────────────────────────
# =============================================================================

@router.post(
    "/",
    response_model=EventRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un nuevo evento",
    description=(
        "Crea un evento en el calendario familiar o personal. "
        "Si se especifica `family_id`, el usuario debe ser miembro de esa familia. "
        "Si no se especifica familia, el evento se crea como **privado** del usuario. "
        "Soporta eventos recurrentes mediante el campo `recurrence_pattern` (formato iCal RRULE)."
    ),
)
def create_event(
    event: EventCreate,
    session: DBSession,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    # Validar si se asigna a una familia, que el usuario sea miembro
    if event.family_id:
        membership = session.exec(
            select(FamilyMember)
            .where(FamilyMember.family_id == event.family_id)
            .where(FamilyMember.user_id == user_id)
        ).first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No eres miembro de esta familia.",
            )

    event_data = event.model_dump()
    event_data["owner_id"] = user_id

    # Si no se especifica familia, es privado por defecto
    if not event_data.get("family_id"):
        event_data["visibility"] = "private"

    db_event = Event.model_validate(event_data)
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    return db_event


@router.get(
    "/",
    response_model=List[EventRead],
    summary="Listar eventos accesibles",
    description=(
        "Retorna todos los eventos a los que tiene acceso el usuario autenticado: "
        "eventos propios, eventos de sus familias y eventos compartidos directamente con él. "
        "Soporta paginación mediante los parámetros `skip` y `limit`."
    ),
)
def read_events(
    skip: Annotated[int, Query(ge=0, description="Número de registros a omitir para paginación.")] = 0,
    limit: Annotated[int, Query(ge=1, le=500, description="Máximo de registros a retornar.")] = 100,
    session: DBSession = None,  # type: ignore[assignment]
    user_id: Annotated[int, Depends(get_current_user_id)] = None,  # type: ignore[assignment]
):
    # Obtener IDs de familias del usuario
    family_ids = session.exec(
        select(FamilyMember.family_id).where(FamilyMember.user_id == user_id)
    ).all()

    # Obtener IDs de eventos compartidos conmigo
    shared_event_ids = session.exec(
        select(EventShare.event_id).where(EventShare.shared_with_user_id == user_id)
    ).all()

    statement = select(Event).where(
        or_(
            Event.owner_id == user_id,
            Event.family_id.in_(family_ids),  # type: ignore
            Event.id.in_(shared_event_ids),   # type: ignore
        )
    ).offset(skip).limit(limit)

    events = session.exec(statement).all()
    return events


@router.get(
    "/{event_id}",
    response_model=EventRead,
    summary="Obtener un evento por ID",
    description=(
        "Retorna los detalles completos de un evento específico. "
        "Solo es accesible si el usuario es el creador, si el evento pertenece a "
        "una de sus familias, o si el evento fue compartido directamente con él."
    ),
)
def read_event(
    event_id: int,
    session: DBSession,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado.")

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

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="No tienes permiso para ver este evento.",
    )


@router.patch(
    "/{event_id}",
    response_model=EventRead,
    summary="Actualizar un evento (PATCH parcial)",
    description=(
        "Actualiza parcialmente los campos de un evento existente. "
        "Solo el creador del evento, un usuario con permiso de edición compartido, "
        "o un admin/moderador de la familia pueden modificar el evento. "
        "Enviar solo los campos que se desean cambiar."
    ),
)
def update_event(
    event_id: int,
    event_update: EventUpdate,
    session: DBSession,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    db_event = session.get(Event, event_id)
    if not db_event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado.")

    # Verificar permisos de edición
    can_edit = False
    if db_event.owner_id == user_id:
        can_edit = True

    if not can_edit:
        share = session.exec(
            select(EventShare)
            .where(EventShare.event_id == event_id)
            .where(EventShare.shared_with_user_id == user_id)
            .where(EventShare.can_edit == True)
        ).first()
        if share:
            can_edit = True

    if not can_edit and db_event.family_id:
        membership = session.exec(
            select(FamilyMember)
            .where(FamilyMember.family_id == db_event.family_id)
            .where(FamilyMember.user_id == user_id)
        ).first()
        if membership and membership.role in ["admin", "moderator"]:
            can_edit = True

    if not can_edit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para editar este evento.",
        )

    event_data = event_update.model_dump(exclude_unset=True)
    for key, value in event_data.items():
        setattr(db_event, key, value)

    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    return db_event


@router.delete(
    "/{event_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar un evento",
    description=(
        "Elimina permanentemente un evento. Solo el creador del evento o un "
        "administrador de la familia pueden realizar esta acción. "
        "Esta operación **no se puede deshacer**."
    ),
)
def delete_event(
    event_id: int,
    session: DBSession,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    db_event = session.get(Event, event_id)
    if not db_event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado.")

    can_delete = False
    if db_event.owner_id == user_id:
        can_delete = True

    if not can_delete and db_event.family_id:
        membership = session.exec(
            select(FamilyMember)
            .where(FamilyMember.family_id == db_event.family_id)
            .where(FamilyMember.user_id == user_id)
        ).first()
        if membership and membership.role == "admin":
            can_delete = True

    if not can_delete:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para eliminar este evento.",
        )

    session.delete(db_event)
    session.commit()
    return None


# =============================================================================
# ── Acciones especiales ───────────────────────────────────────────────────────
# =============================================================================

@router.post(
    "/{event_id}/assign",
    response_model=EventRead,
    summary="Asignar evento a un miembro",
    description=(
        "Asigna la responsabilidad de un evento a un miembro específico de la familia. "
        "Solo el creador del evento o un admin/moderador de la familia pueden realizar la asignación. "
        "El usuario destino debe ser miembro de la misma familia. "
        "La operación queda registrada en el historial de asignaciones."
    ),
)
def assign_event(
    event_id: int,
    request: AssignEventRequest,
    session: DBSession,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    db_event = session.get(Event, event_id)
    if not db_event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado.")

    # Verificar permisos
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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para asignar este evento.",
        )

    # Verificar que el usuario asignado sea miembro de la familia
    if db_event.family_id:
        target_membership = session.exec(
            select(FamilyMember)
            .where(FamilyMember.family_id == db_event.family_id)
            .where(FamilyMember.user_id == request.assigned_to_id)
        ).first()
        if not target_membership:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El usuario destino no es miembro de esta familia.",
            )

    # Registrar historial de reasignación
    history = TaskAssignmentHistory(
        event_id=event_id,
        from_user_id=db_event.assigned_to_id,
        to_user_id=request.assigned_to_id,
    )
    session.add(history)

    db_event.assigned_to_id = request.assigned_to_id
    session.add(db_event)
    session.commit()
    session.refresh(db_event)

    # Reprogramar notificaciones para el nuevo usuario
    schedule_notifications_for_event(session, event_id)

    return db_event


@router.post(
    "/{event_id}/complete",
    response_model=EventRead,
    summary="Marcar evento como completado",
    description=(
        "Marca un evento como completado y registra la fecha y el usuario que lo completó. "
        "Si el evento es recurrente, se crea automáticamente la próxima instancia "
        "según el patrón de recurrencia configurado. "
        "Pueden completar: el creador, el asignado, o cualquier miembro de la familia."
    ),
)
def complete_event(
    event_id: int,
    session: DBSession,
    user_id: Annotated[int, Depends(get_current_user_id)],
    request: Optional[CompleteEventRequest] = None,
):
    db_event = session.get(Event, event_id)
    if not db_event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado.")

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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para completar este evento.",
        )

    db_event.status = "completed"
    db_event.completed_at = datetime.now(timezone.utc)
    db_event.completed_by_id = (request.completed_by_id if request else None) or user_id

    session.add(db_event)
    session.commit()
    session.refresh(db_event)

    # Si es recurrente, crear próxima instancia
    if db_event.is_recurring:
        handle_recurring_event_completion(session, event_id)

    return db_event


@router.put(
    "/{event_id}/notification-config",
    response_model=EventRead,
    summary="Actualizar configuración de notificaciones de un evento",
    description=(
        "Reemplaza la configuración de notificaciones de un evento con los nuevos valores. "
        "Cancela las notificaciones pendientes anteriores y reprograma con la nueva configuración. "
        "Formato esperado: `{\"pre\": [15, 60], \"post\": false}` donde los valores son minutos de anticipación. "
        "Solo el creador o el usuario asignado pueden modificar la configuración."
    ),
)
def update_notification_config(
    event_id: int,
    request: NotificationConfigRequest,
    session: DBSession,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    db_event = session.get(Event, event_id)
    if not db_event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado.")

    if db_event.owner_id != user_id and db_event.assigned_to_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para configurar las notificaciones de este evento.",
        )

    db_event.notification_config = request.notification_config
    session.add(db_event)

    # Eliminar notificaciones pendientes antiguas
    old_notifications = session.exec(
        select(NotificationLog)
        .where(NotificationLog.event_id == event_id)
        .where(NotificationLog.sent_at == None)  # noqa: E711
    ).all()
    for notif in old_notifications:
        session.delete(notif)

    session.commit()
    session.refresh(db_event)

    # Reprogramar con nueva configuración
    schedule_notifications_for_event(session, event_id)

    return db_event


@router.get(
    "/{event_id}/notification-history",
    summary="Historial de notificaciones de un evento",
    description=(
        "Retorna el historial completo de notificaciones (enviadas y pendientes) "
        "de un evento específico, ordenadas cronológicamente. "
        "Solo el creador o el usuario asignado pueden consultar este historial."
    ),
)
def get_notification_history(
    event_id: int,
    session: DBSession,
    user_id: Annotated[int, Depends(get_current_user_id)],
):
    db_event = session.get(Event, event_id)
    if not db_event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado.")

    if db_event.owner_id != user_id and db_event.assigned_to_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver el historial de notificaciones de este evento.",
        )

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
                "status": "sent" if n.sent_at else "pending",
            }
            for n in notifications
        ],
    }
