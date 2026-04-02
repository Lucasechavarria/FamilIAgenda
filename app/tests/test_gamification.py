from app.models import User, Task
from app.security import get_password_hash

def test_user_gain_points_on_task_completion(client: TestClient, session: Session):
    """
    Verifica que al completar una tarea, el usuario gane puntos y suba de nivel.
    """
    # 1. Crear usuario de prueba
    user = User(
        email="puntos@test.com",
        full_name="User Puntos",
        hashed_password=get_password_hash("test-pass-123"),
        points=90,
        level=1
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # 2. Login para obtener token
    login_res = client.post("/api/auth/token", json={
        "email": "puntos@test.com",
        "password": "test-pass-123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Crear una tarea
    task_res = client.post("/api/tasks/", json={
        "title": "Tarea de prueba",
        "description": "Ganar puntos",
        "priority": "normal"
    }, headers=headers)
    task_id = task_res.json()["id"]

    # 4. Completar la tarea
    client.post(f"/api/tasks/{task_id}/complete", headers=headers)

    # 5. Verificar puntos y nivel
    me_res = client.get("/api/auth/me", headers=headers)
    data = me_res.json()
    
    assert data["points"] == 100
    assert data["level"] == 2
    assert data["level_name"] == "Guerrero del Calendario"
