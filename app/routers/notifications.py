from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..database import get_session
from ..models import NotificationToken
from ..schemas import TokenRegistration
from ..security import get_current_user_id

router = APIRouter()

@router.post("/register-token", status_code=status.HTTP_201_CREATED)
def register_device_token(
    payload: TokenRegistration,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    # Verificar si el token ya existe para este usuario
    statement = select(NotificationToken).where(NotificationToken.token == payload.token)
    existing_token = session.exec(statement).first()

    if not existing_token:
        db_token = NotificationToken(token=payload.token, device_info=payload.device_info, user_id=user_id)
        session.add(db_token)
        session.commit()
        session.refresh(db_token)
        return {"message": "Token registrado exitosamente"}
    
    # Si existe pero no tiene user_id (migración) o es de otro usuario (cambio de cuenta)
    if existing_token.user_id != user_id:
        existing_token.user_id = user_id
        session.add(existing_token)
        session.commit()
        return {"message": "Token actualizado para el usuario actual"}

    return {"message": "El token ya estaba registrado"}