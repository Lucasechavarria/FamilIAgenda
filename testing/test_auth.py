from fastapi.testclient import TestClient
from sqlmodel import Session
from app.models import User

def test_register_user(client: TestClient):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "password123",
            "full_name": "Test User",
            "family_name": "Test Family"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user_email"] == "test@example.com"

def test_login_user(client: TestClient):
    # Primero registrar
    client.post(
        "/api/auth/register",
        json={
            "email": "login@example.com",
            "password": "password123",
            "full_name": "Login User",
            "family_name": "Login Family"
        }
    )
    
    # Luego login
    response = client.post(
        "/api/auth/token",
        json={
            "email": "login@example.com",
            "password": "password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data

def test_get_current_user(client: TestClient):
    # Registrar y obtener token
    register_res = client.post(
        "/api/auth/register",
        json={
            "email": "me@example.com",
            "password": "password123",
            "full_name": "Me User",
            "family_name": "Me Family"
        }
    )
    token = register_res.json()["access_token"]
    
    # Obtener /me
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@example.com"
    assert data["color"] == "#3B82F6"  # Default color

def test_update_user_color(client: TestClient):
    # Registrar
    register_res = client.post(
        "/api/auth/register",
        json={
            "email": "color@example.com",
            "password": "password123",
            "full_name": "Color User",
            "family_name": "Color Family"
        }
    )
    token = register_res.json()["access_token"]
    
    # Actualizar color
    response = client.patch(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"color": "#EF4444"}
    )
    assert response.status_code == 200
    assert response.json()["color"] == "#EF4444"
    
    # Verificar persistencia
    get_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert get_res.json()["color"] == "#EF4444"
