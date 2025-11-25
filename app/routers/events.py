from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, or_

from ..database import get_session
from ..models import Event, FamilyMember
from ..schemas import EventCreate, EventRead, EventUpdate
from ..security import get_current_user_id

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
