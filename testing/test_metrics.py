from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from sqlmodel import select, Session
from app.models import User, FamilyMember
from unittest.mock import patch

@patch("app.routers.events.schedule_notifications_for_event")
@patch("app.routers.events.handle_recurring_event_completion")
def test_metrics_calculation(mock_handle, mock_schedule, client: TestClient, session: Session):
    # Registrar usuario
    res = client.post(
        "/api/auth/register",
        json={
            "email": "metrics@example.com",
            "password": "pass",
            "full_name": "Metrics User",
            "family_name": "Metrics Family"
        }
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Obtener family_id
    user = session.exec(select(User).where(User.email == "metrics@example.com")).first()
    assert user is not None, "User not found after registration"
    
    family_member = session.exec(select(FamilyMember).where(FamilyMember.user_id == user.id)).first()
    assert family_member is not None, "Family member not found"
    
    family_id = family_member.family_id
    
    # Crear eventos
    now = datetime.utcnow()
    
    # Evento 1: Completado
    res_event1 = client.post(
        "/api/events/",
        headers=headers,
        json={
            "title": "Done",
            "start_time": now.isoformat(),
            "end_time": (now + timedelta(hours=1)).isoformat(),
            "category": "work",
            "family_id": family_id
        }
    )
    assert res_event1.status_code in [200, 201]
    event1_id = res_event1.json()["id"]
    
    # Completar evento 1
    complete_res = client.post(
        f"/api/events/{event1_id}/complete",
        headers=headers,
        json={}  # El backend usa current_user si no se especifica
    )

    assert complete_res.status_code == 200, f"Error completing event: {complete_res.text}"
    
    # Evento 2: Pendiente
    res_event2 = client.post(
        "/api/events/",
        headers=headers,
        json={
            "title": "Pending",
            "start_time": now.isoformat(),
            "end_time": (now + timedelta(hours=1)).isoformat(),
            "category": "personal",
            "family_id": family_id
        }
    )
    assert res_event2.status_code in [200, 201]
    
    # Obtener métricas
    response = client.get("/api/events/metrics?range=all", headers=headers)
    assert response.status_code == 200
    data = response.json()
    
    # Verificar métricas
    assert data["totalEvents"] == 2, f"Expected 2 events, got {data['totalEvents']}"
    assert data["completedEvents"] == 1, f"Expected 1 completed, got {data['completedEvents']}"
    assert data["pendingEvents"] == 1, f"Expected 1 pending, got {data['pendingEvents']}"
    assert data["categoryBreakdown"]["work"] == 1
    assert data["categoryBreakdown"]["personal"] == 1
