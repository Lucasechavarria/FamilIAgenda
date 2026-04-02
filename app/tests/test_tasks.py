from app.models import Task, User

def test_create_task(auth_client):
    response = auth_client.post(
        "/api/tasks/",
        json={
            "title": "Tarea de Prueba",
            "description": "Descripción",
            "priority": "medium",
            "due_date": "2026-05-01T10:00:00"
        }
    )
    assert response.status_code == 201
    assert response.json()["title"] == "Tarea de Prueba"

def test_read_tasks(auth_client):
    auth_client.post("/api/tasks/", json={"title": "T1", "priority": "low"})
    auth_client.post("/api/tasks/", json={"title": "T2", "priority": "high"})
    
    response = auth_client.get("/api/tasks/")
    assert response.status_code == 200
    assert len(response.json()) >= 2

def test_complete_task_gamification(auth_client, session):
    # 1. Crear tarea
    res = auth_client.post("/api/tasks/", json={"title": "Task for XP", "priority": "medium"})
    task_id = res.json()["id"]
    
    # 2. Completar
    comp_res = auth_client.post(f"/api/tasks/{task_id}/complete")
    assert comp_res.status_code == 200
    
    # 3. Verificar puntos del usuario
    # El usuario de auth_client es "test@ejemplo.com"
    user = session.exec(select(User).where(User.email == "test@ejemplo.com")).first()
    assert user.points >= 10
    assert user.level >= 1

def test_delete_task(auth_client):
    res = auth_client.post("/api/tasks/", json={"title": "To delete"})
    task_id = res.json()["id"]
    
    del_res = auth_client.delete(f"/api/tasks/{task_id}")
    assert del_res.status_code == 204
    
    get_res = auth_client.get(f"/api/tasks/{task_id}")
    assert get_res.status_code == 404

from sqlmodel import select # needed for previous test
