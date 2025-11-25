from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..database import get_session
from ..models import Event, EventShare, FamilyMember
from ..schemas import EventShareCreate, EventShareRead
from ..security import get_current_user_id

router = APIRouter()

@router.post("/events/{event_id}/share", response_model=EventShareRead, status_code=status.HTTP_201_CREATED)
def share_event(
    event_id: int,
    share_data: EventShareCreate,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """Compartir un evento con otro usuario específico"""
    # Verificar que el evento existe
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    # Verificar que soy el dueño del evento
    if event.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Solo el creador puede compartir este evento")
    
    # Verificar que no se comparta consigo mismo
    if share_data.shared_with_user_id == user_id:
        raise HTTPException(status_code=400, detail="No puedes compartir un evento contigo mismo")
    
    # Verificar si ya está compartido
    existing_share = session.exec(
        select(EventShare)
        .where(EventShare.event_id == event_id)
        .where(EventShare.shared_with_user_id == share_data.shared_with_user_id)
    ).first()
    
    if existing_share:
        raise HTTPException(status_code=400, detail="El evento ya está compartido con este usuario")
    
    # Crear el share
    db_share = EventShare(
        event_id=event_id,
        shared_with_user_id=share_data.shared_with_user_id,
        can_edit=share_data.can_edit
    )
    
    session.add(db_share)
    session.commit()
    session.refresh(db_share)
    
    return db_share

@router.get("/events/{event_id}/shares", response_model=List[EventShareRead])
def get_event_shares(
    event_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """Obtener lista de usuarios con quienes se ha compartido un evento"""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    # Solo el dueño puede ver con quién está compartido
    if event.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Solo el creador puede ver esta información")
    
    shares = session.exec(
        select(EventShare).where(EventShare.event_id == event_id)
    ).all()
    
    return shares

@router.delete("/events/{event_id}/share/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
def unshare_event(
    event_id: int,
    share_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """Dejar de compartir un evento con un usuario"""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    if event.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Solo el creador puede dejar de compartir")
    
    share = session.get(EventShare, share_id)
    if not share or share.event_id != event_id:
        raise HTTPException(status_code=404, detail="Share no encontrado")
    
    session.delete(share)
    session.commit()
    
    return None

def check_event_permission(event: Event, user_id: int, session: Session, require_edit: bool = False) -> bool:
    """
    Verifica si un usuario tiene permiso para ver/editar un evento.
    
    Args:
        event: El evento a verificar
        user_id: ID del usuario
        session: Sesión de DB
        require_edit: Si True, verifica permiso de edición
    
    Returns:
        True si tiene permiso, False si no
    """
    # 1. Soy el dueño
    if event.owner_id == user_id:
        return True
    
    # 2. Está compartido conmigo
    share = session.exec(
        select(EventShare)
        .where(EventShare.event_id == event.id)
        .where(EventShare.shared_with_user_id == user_id)
    ).first()
    
    if share:
        if require_edit:
            return share.can_edit
        return True
    
    # 3. Es de una familia a la que pertenezco
    if event.family_id and event.visibility == "family":
        membership = session.exec(
            select(FamilyMember)
            .where(FamilyMember.family_id == event.family_id)
            .where(FamilyMember.user_id == user_id)
        ).first()
        
        if membership:
            if require_edit:
                # Solo admin y moderator pueden editar eventos de familia
                return membership.role in ["admin", "moderator"]
            return True
    
    return False
