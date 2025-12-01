from fastapi.testclient import TestClient
from datetime import datetime, timedelta

def get_auth_header(client: TestClient, email="tasks@example.com"):
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "password123",
            "full_name": "Task User",
            "family_name": "Task Family"
        }
    )
    assert response.status_code == 200, f"Registration failed: {response.json()}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_create_task(client: TestClient):
    headers = get_auth_header(client, "task1@example.com")
    
    due = datetime.utcnow() + timedelta(days=1)
    
    response = client.post(
        "/api/tasks/",
        headers=headers,
        json={
            "title": "New Task",
            "description": "Do something",
            "due_date": due.isoformat(),
            "priority": "high",
            "assigned_to_id": None,
            "is_recurring": False,
            "recurrence_pattern": None,
            "notification_config": '{"pre": [15], "post": false}'
        }
    )
    assert response.status_code == 200, f"Create task failed: {response.text}"
    data = response.json()
    assert data["title"] == "New Task"
    assert data["priority"] == "high"
    assert data["status"] == "pending"

def test_get_tasks(client: TestClient):
    headers = get_auth_header(client, "task2@example.com")
    
    due = datetime.utcnow() + timedelta(days=1)
    
    # Crear tarea
    create_res = client.post(
        "/api/tasks/",
        headers=headers,
        json={
            "title": "Task 1",
            "due_date": due.isoformat(),
            "description": "Test task",
            "priority": "normal"
        }
    )
    assert create_res.status_code == 200, f"Create task failed: {create_res.text}"
    
    # Obtener tareas
    response = client.get("/api/tasks/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1, f"Expected at least 1 task, got {len(data)}"
    assert data[0]["title"] == "Task 1"
    assert data[0]["priority"] == "normal"
