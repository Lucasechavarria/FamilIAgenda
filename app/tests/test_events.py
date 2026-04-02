from datetime import datetime, timedelta
from app.models import Event, FamilyMember, User, Family
from sqlmodel import select

def test_create_event_success(auth_client, session):
    # Obtener family_id del usuario de prueba
    member = session.exec(select(FamilyMember)).first()
    family_id = member.family_id

    response = auth_client.post(
        "/api/events/",
        json={
            "title": "Reunión Familiar",
            "start_time": "2026-06-01T10:00:00",
            "end_time": "2026-06-01T11:00:00",
            "family_id": family_id,
            "category": "family"
        }
    )
    assert response.status_code == 201
    assert response.json()["has_conflict"] is False

def test_create_event_conflict(auth_client, session):
    member = session.exec(select(FamilyMember)).first()
    family_id = member.family_id

    # 1. Crear primer evento (usando el family_id del usuario logueado en auth_client)
    auth_client.post("/api/events/", json={
        "title": "Evento 1",
        "start_time": "2026-06-01T12:00:00",
        "end_time": "2026-06-01T13:00:00",
        "family_id": family_id
    })

    # 2. Crear evento solapado
    response = auth_client.post("/api/events/", json={
        "title": "Evento 2 (Conflicto)",
        "start_time": "2026-06-01T12:30:00",
        "end_time": "2026-06-01T13:30:00",
        "family_id": family_id
    })
    
    assert response.status_code == 201
    assert response.json()["has_conflict"] is True
    assert "Choque con: Evento 1" in response.json()["conflict_details"]

def test_event_privacy_busy(auth_client, client, session):
    # 1. El usuario de auth_client crea un evento privado con visibilidad 'busy'
    # Obtenemos su familia primero
    member1 = session.exec(select(FamilyMember)).first()
    family_id = member1.family_id

    res = auth_client.post("/api/events/", json={
        "title": "Secreto Médico",
        "start_time": "2026-06-01T15:00:00",
        "end_time": "2026-06-01T16:00:00",
        "family_id": family_id,
        "visibility": "private",
        "visibility_type": "busy"
    })
    assert res.status_code == 201
    
    # 2. Registramos un segundo usuario
    client.post("/api/auth/register", json={
        "email": "otro@ejemplo.com",
        "password": "pass",
        "full_name": "Otro Usuario"
    })
    login_res = client.post("/api/auth/token", json={"email": "otro@ejemplo.com", "password": "pass"})
    token = login_res.json()["access_token"]
    
    # 3. Lo unimos a la misma familia
    new_user = session.exec(select(User).where(User.email == "otro@ejemplo.com")).first()
    session.add(FamilyMember(family_id=family_id, user_id=new_user.id, role="member"))
    session.commit()
    
    # 4. El segundo usuario pide los eventos
    response = client.get("/api/events/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    events = response.json()
    
    # Debería ver "Ocupado" en vez de "Secreto Médico" para el evento que no es suyo
    found_busy = False
    for ev in events:
        if ev["title"] == "Ocupado":
            found_busy = True
            assert ev["description"] == "Evento privado"
            # Verificar que no se filtró el título real accidentalmente
            assert ev["title"] != "Secreto Médico"
    
    assert found_busy, f"No se encontró el evento anonimizado. Eventos recibidos: {events}"
