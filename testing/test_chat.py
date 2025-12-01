from fastapi.testclient import TestClient
from sqlmodel import select, Session
from app.models import User, FamilyMember, ChatMessage
from datetime import datetime

def test_get_chat_history(client: TestClient, session: Session):
    # Registrar usuario
    res = client.post(
        "/api/auth/register",
        json={
            "email": "chat_hist@example.com",
            "password": "pass",
            "full_name": "Chat User",
            "family_name": "Chat Family"
        }
    )
    assert res.status_code == 200, f"Registration failed: {res.json()}"
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Obtener IDs
    user = session.exec(select(User).where(User.email == "chat_hist@example.com")).first()
    assert user is not None, "User not found in DB after registration"
        
    member = session.exec(select(FamilyMember).where(FamilyMember.user_id == user.id)).first()
    assert member is not None, "Member not found in DB"
        
    family_id = member.family_id
    
    # Insertar mensaje manualmente (simulando WebSocket)
    msg = ChatMessage(
        family_id=family_id,
        user_id=user.id,
        content="Hello History",
        created_at=datetime.utcnow()
    )
    session.add(msg)
    session.commit()
    session.refresh(msg)
    
    # Obtener historial
    response = client.get(f"/api/chat/history/{family_id}", headers=headers)
    assert response.status_code == 200, f"Get history failed: {response.text}"
    data = response.json()
    assert len(data) >= 1, f"Expected at least 1 message, got {len(data)}"
    
    # Verificar contenido del mensaje
    found_message = False
    for message in data:
        if message.get("content") == "Hello History":
            found_message = True
            assert message["user_name"] == "Chat User"
            break
    
    assert found_message, "Message 'Hello History' not found in chat history"
