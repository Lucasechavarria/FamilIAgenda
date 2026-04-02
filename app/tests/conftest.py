import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from typing import Generator

from app.main import app
from app.database import get_session

# Base de datos SQLite en memoria para pruebas
@pytest.fixture(name="session")
def session_fixture() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

@pytest.fixture(name="client")
def client_fixture(session: Session) -> Generator[TestClient, None, None]:
    def get_session_override():
        return session
    
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

@pytest.fixture(name="auth_client")
def auth_client_fixture(client: TestClient) -> Generator[TestClient, None, None]:
    # Registrar usuario y familia
    client.post("/api/auth/register", json={
        "email": "test@ejemplo.com",
        "password": "password",
        "full_name": "Test User",
        "family_name": "Test Family"
    })
    
    # Login
    login_res = client.post("/api/auth/token", json={
        "email": "test@ejemplo.com",
        "password": "password"
    })
    token = login_res.json()["access_token"]
    
    # Configurar headers globales para este cliente
    client.headers = {"Authorization": f"Bearer {token}"}
    yield client
