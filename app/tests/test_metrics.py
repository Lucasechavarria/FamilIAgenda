from app.models import FamilyMember

def test_get_metrics_empty(auth_client, session):
    response = auth_client.get("/api/metrics/?range=all")
    assert response.status_code == 200
    data = response.json()
    assert data["totalEvents"] == 0
    assert len(data["memberStats"]) > 0 # El usuario de prueba está en la lista

def test_get_metrics_with_data(auth_client, session):
    # 1. Obtener IDs
    member = session.exec(select(FamilyMember)).first()
    family_id = member.family_id
    user_id = member.user_id

    # 2. Crear eventos (1 completado, 1 pendiente)
    auth_client.post("/api/events/", json={
        "title": "E1", "start_time": "2026-06-01T10:00:00", 
        "end_time": "2026-06-01T11:00:00", "family_id": family_id,
        "category": "work"
    })
    res_e2 = auth_client.post("/api/events/", json={
        "title": "E2", "start_time": "2026-06-01T12:00:00", 
        "end_time": "2026-06-01T13:00:00", "family_id": family_id,
        "category": "personal"
    })
    e2_id = res_e2.json()["id"]
    auth_client.post(f"/api/events/{e2_id}/complete")

    # 3. Consultar métricas
    response = auth_client.get("/api/metrics/?range=all")
    assert response.status_code == 200
    data = response.json()
    
    assert data["totalEvents"] == 2
    assert data["completedEvents"] == 1
    assert data["categoryBreakdown"]["work"] == 1
    assert data["categoryBreakdown"]["personal"] == 1

def test_metrics_member_stats(auth_client, session):
    # El usuario de prueba debería estar en memberStats con sus puntos
    response = auth_client.get("/api/metrics/?range=all")
    data = response.json()
    
    found = False
    for stat in data["memberStats"]:
        if stat["user_name"] == "Test User":
            found = True
            assert "points" in stat
            assert "level_name" in stat
    assert found

from sqlmodel import select
