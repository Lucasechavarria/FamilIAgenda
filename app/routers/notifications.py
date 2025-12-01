from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from datetime import datetime

from ..database import get_session
from ..models import NotificationToken, NotificationLog, User
from ..schemas import TokenRegistration
from ..security import get_current_user_id

router = APIRouter()

@router.post("/register-token", status_code=status.HTTP_201_CREATED)
def register_device_token(
    payload: TokenRegistration,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """Registrar token de dispositivo para notificaciones push"""
    # Verificar si el token ya existe para este usuario
    statement = select(NotificationToken).where(NotificationToken.token == payload.token)
    existing_token = session.exec(statement).first()

    if not existing_token:
        db_token = NotificationToken(
            token=payload.token, 
            device_info=payload.device_info, 
            user_id=user_id
        )
        session.add(db_token)
        session.commit()
        session.refresh(db_token)
        return {"message": "Token registrado exitosamente", "token_id": db_token.id}
    
    # Si existe pero no tiene user_id (migración) o es de otro usuario (cambio de cuenta)
    if existing_token.user_id != user_id:
        existing_token.user_id = user_id
        session.add(existing_token)
        session.commit()
        return {"message": "Token actualizado para el usuario actual"}

    return {"message": "El token ya estaba registrado"}

@router.get("/history")
def get_notification_history(
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
    limit: int = 50,
    skip: int = 0
):
    """Obtener historial de notificaciones enviadas al usuario"""
    # Obtener notificaciones del usuario
    statement = (
        select(NotificationLog)
        .where(NotificationLog.user_id == user_id)
        .order_by(NotificationLog.sent_at.desc())
        .offset(skip)
        .limit(limit)
    )
    
    notifications = session.exec(statement).all()
    
    return [
        {
            "id": notif.id,
            "event_id": notif.event_id,
            "title": notif.title,
            "body": notif.body,
            "sent_at": notif.sent_at.isoformat() if notif.sent_at else None,
            "status": notif.status
        }
        for notif in notifications
    ]

@router.delete("/token/{token}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification_token(
    token: str,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """Eliminar token de notificaciones (logout de dispositivo)"""
    # Buscar el token
    statement = select(NotificationToken).where(
        NotificationToken.token == token,
        NotificationToken.user_id == user_id
    )
    db_token = session.exec(statement).first()
    
    if not db_token:
        raise HTTPException(
            status_code=404,
            detail="Token no encontrado o no pertenece al usuario"
        )
    
    session.delete(db_token)
    session.commit()
    return None

@router.post("/test")
def send_test_notification(
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """Enviar notificación de prueba al usuario"""
    # Obtener tokens del usuario
    statement = select(NotificationToken).where(NotificationToken.user_id == user_id)
    tokens = session.exec(statement).all()
    
    if not tokens:
        raise HTTPException(
            status_code=404,
            detail="No hay tokens registrados para este usuario"
        )
    
    # Obtener info del usuario
    user = session.get(User, user_id)
    
    # Intentar enviar notificación de prueba
    try:
        from ..notification_service import send_notification
        
        sent_count = 0
        for token in tokens:
            try:
                send_notification(
                    token=token.token,
                    title="🔔 Notificación de Prueba",
                    body=f"Hola {user.full_name}! Tu sistema de notificaciones funciona correctamente.",
                    data={"type": "test", "timestamp": datetime.utcnow().isoformat()}
                )
                sent_count += 1
            except Exception as e:
                print(f"Error enviando a token {token.id}: {e}")
                continue
        
        if sent_count > 0:
            return {
                "message": f"Notificación de prueba enviada a {sent_count} dispositivo(s)",
                "sent_count": sent_count,
                "total_tokens": len(tokens)
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="No se pudo enviar la notificación a ningún dispositivo"
            )
            
    except ImportError:
        # Si Firebase no está configurado
        return {
            "message": "Servicio de notificaciones no configurado (Firebase)",
            "tokens_registered": len(tokens),
            "note": "Configura Firebase para enviar notificaciones reales"
        }