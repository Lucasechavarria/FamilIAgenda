from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from unittest.mock import patch
from sqlmodel import Session, select
from app.models import User, FamilyMember

def get_auth_header(client: TestClient, session: Session, email="events@example.com"):
    """Helper para registrar usuario y obtener headers con family_id"""
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "password123",
            "full_name": "Event User",
            "family_name": "Event Family"
        }
    )
    assert response.status_code == 200, f"Registration failed: {response.json()}"
    token = response.json()["access_token"]
    
    # Obtener family_id del usuario
    user = session.exec(select(User).where(User.email == email)).first()
    member = session.exec(select(FamilyMember).where(FamilyMember.user_id == user.id)).first()
    family_id = member.family_id if member else None
    
    return {"Authorization": f"Bearer {token}"}, family_id

@patch("app.routers.events.schedule_notifications_for_event")
def test_create_event(mock_schedule, client: TestClient, session: Session):
    headers, family_id = get_auth_header(client, session, "event1@example.com")
    
    start = datetime.utcnow()
    end = start + timedelta(hours=1)
    
    response = client.post(
        "/api/events/",
        headers=headers,
        json={
            "title": "Test Event",
            "description": "Description",
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "category": "personal",
            "family_id": family_id
        }
    )
    # El endpoint retorna 201 Created
    assert response.status_code in [200, 201]
    data = response.json()
    assert data["title"] == "Test Event"
    assert data["id"] is not None

@patch("app.routers.events.schedule_notifications_for_event")
def test_create_recurring_event(mock_schedule, client: TestClient, session: Session):
    headers, family_id = get_auth_header(client, session, "event2@example.com")
    
    start = datetime.utcnow()
    end = start + timedelta(hours=1)
    
    recurrence_pattern = '{"frequency": "weekly", "daysOfWeek": [1, 3]}'
    
    response = client.post(
        "/api/events/",
        headers=headers,
        json={
            "title": "Recurring Event",
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "is_recurring": True,
            "recurrence_pattern": recurrence_pattern,
            "family_id": family_id
        }
    )
    assert response.status_code in [200, 201]
    data = response.json()
    assert data["is_recurring"] is True
    assert data["recurrence_pattern"] == recurrence_pattern

@patch("app.routers.events.schedule_notifications_for_event")
def test_assign_event(mock_schedule, client: TestClient, session: Session):
    # Registrar usuario principal
    res1 = client.post(
        "/api/auth/register",
        json={
            "email": "mom@example.com",
            "password": "pass",
            "full_name": "Mom",
            "family_name": "Smiths"
        }
    )
    assert res1.status_code == 200, f"Registration failed: {res1.json()}"
    token1 = res1.json()["access_token"]
    headers = {"Authorization": f"Bearer {token1}"}
    
    # Obtener ID del usuario y family_id
    me_res = client.get("/api/auth/me", headers=headers)
    user_id = me_res.json()["id"]
    
    user = session.exec(select(User).where(User.id == user_id)).first()
    member = session.exec(select(FamilyMember).where(FamilyMember.user_id == user.id)).first()
    family_id = member.family_id
    
    start = datetime.utcnow()
    end = start + timedelta(hours=1)
    
    response = client.post(
        "/api/events/",
        headers=headers,
        json={
            "title": "Chore",
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "assigned_to_id": user_id,
            "family_id": family_id
        }
    )
    assert response.status_code in [200, 201]
    assert response.json()["assigned_to_id"] == user_id
