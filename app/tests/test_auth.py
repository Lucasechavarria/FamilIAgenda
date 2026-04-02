from app.models import User, Family, FamilyMember
from app.security import get_password_hash

def test_register_user_success(client, session):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "nuevo@ejemplo.com",
            "password": "password123",
            "full_name": "Nuevo Usuario",
            "family_name": "Familia de Prueba"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user_email"] == "nuevo@ejemplo.com"
    assert data["family_id"] is not None

def test_register_duplicate_email(client, session):
    # Crear usuario previo
    user = User(email="duplicado@ejemplo.com", full_name="Original", hashed_password="...")
    session.add(user)
    session.commit()

    response = client.post(
        "/api/auth/register",
        json={
            "email": "duplicado@ejemplo.com",
            "password": "password123",
            "full_name": "Duplicado"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "El email ya está registrado"

def test_login_success(client, session):
    # Crear usuario
    password = "secret_password"
    hashed = get_password_hash(password)
    user = User(email="login@ejemplo.com", full_name="User Login", hashed_password=hashed)
    session.add(user)
    session.commit()

    response = client.post(
        "/api/auth/token",
        json={
            "email": "login@ejemplo.com",
            "password": password
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user_name"] == "User Login"

def test_get_current_user_info(client, session):
    # Registro y login para obtener token
    client.post("/api/auth/register", json={
        "email": "me@ejemplo.com",
        "password": "pass",
        "full_name": "Yo Mismo"
    })
    login_res = client.post("/api/auth/token", json={"email": "me@ejemplo.com", "password": "pass"})
    token = login_res.json().get("access_token")

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "me@ejemplo.com"

def test_update_profile(client, session):
    # Registro y login
    client.post("/api/auth/register", json={
        "email": "update@ejemplo.com",
        "password": "pass",
        "full_name": "Antes"
    })
    login_res = client.post("/api/auth/token", json={"email": "update@ejemplo.com", "password": "pass"})
    token = login_res.json()["access_token"]

    response = client.patch(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"full_name": "Después", "color": "#FF0000"}
    )
    assert response.status_code == 200
    assert response.json()["full_name"] == "Después"
    assert response.json()["color"] == "#FF0000"
