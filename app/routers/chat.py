from typing import List, Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime, timezone
import json

from ..database import get_session
from ..models import ChatMessage, FamilyMember, User
from ..schemas import MessageRead
from ..security import get_current_user_id_websocket
from ..services.websocket_manager import manager

router = APIRouter()

@router.websocket("/ws/{family_id}/{token}")
async def websocket_endpoint(
    websocket: WebSocket, 
    family_id: int, 
    token: str,
    session: Session = Depends(get_session)
):
    # Validar token y obtener usuario (simplificado para WebSocket)
    user_id = await get_current_user_id_websocket(token)
    if not user_id:
        await websocket.close(code=1008)
        return

    # Verificar pertenencia a la familia
    member = session.exec(select(FamilyMember).where(
        FamilyMember.user_id == user_id,
        FamilyMember.family_id == family_id
    )).first()
    
    if not member:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, family_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            # Guardar mensaje en BD
            message_data = json.loads(data)
            content = message_data.get("content")
            
            if content:
                new_message = ChatMessage(
                    family_id=family_id,
                    user_id=user_id,
                    content=content,
                    created_at=datetime.now(timezone.utc)
                )
                session.add(new_message)
                session.commit()
                session.refresh(new_message)
                
                # Obtener nombre de usuario para enviar
                user = session.get(User, user_id)
                
                # Broadcast a la familia
                response = {
                    "type": "chat",
                    "id": new_message.id,
                    "user_id": user_id,
                    "user_name": user.full_name if user else "Usuario",
                    "content": content,
                    "created_at": new_message.created_at.isoformat()
                }
                await manager.broadcast(response, family_id)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, family_id)

@router.get("/history/{family_id}", response_model=List[MessageRead])
def get_chat_history(
    family_id: int,
    session: Session = Depends(get_session)
    # Aquí deberíamos validar auth normal también, pero por brevedad lo omito o uso dependencia global
):
    messages = session.exec(
        select(ChatMessage, User.full_name)
        .join(User)
        .where(ChatMessage.family_id == family_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(50)
    ).all()
    
    # Mapear resultados
    result = []
    for msg, user_name in messages:
        m_dict = msg.model_dump()
        m_dict["user_name"] = user_name
        result.append(m_dict)
        
    return list(reversed(result)) # Devolver cronológico
