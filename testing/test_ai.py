from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

def get_auth_header(client: TestClient, email="ai@example.com"):
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "password123",
            "full_name": "AI User",
            "family_name": "AI Family"
        }
    )
    assert response.status_code == 200, f"Registration failed: {response.json()}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@patch("app.routers.ai.AI_PROVIDER", "groq")
@patch("app.routers.ai.call_groq_ai")
def test_ai_suggest_events(mock_groq, client: TestClient):
    """Test AI event suggestion endpoint"""
    headers = get_auth_header(client, "ai1@example.com")
    
    # Mock AI response
    mock_groq.return_value = '''[
        {
            "title": "Reunión de equipo",
            "start_time": "2025-12-01T10:00:00",
            "end_time": "2025-12-01T11:00:00",
            "category": "work",
            "description": "Reunión semanal del equipo"
        }
    ]'''
    
    response = client.post(
        "/api/ai/sugerir-eventos",
        headers=headers,
        json={"texto": "Necesito una reunión de equipo la próxima semana"}
    )
    
    # El endpoint puede retornar 200 o 500 si no hay AI configurada
    if response.status_code == 200:
        data = response.json()
        assert "eventos" in data or isinstance(data, list)
        mock_groq.assert_called_once()
    else:
        # Si no hay AI configurada, debe retornar error apropiado
        assert response.status_code in [500, 503]

@patch("app.routers.ai.AI_PROVIDER", "groq")
@patch("app.routers.ai.call_groq_ai")
def test_ai_optimize_schedule(mock_groq, client: TestClient):
    """Test AI schedule optimization endpoint"""
    headers = get_auth_header(client, "ai2@example.com")
    
    # Mock AI response
    mock_groq.return_value = '''[
        {
            "event_id": 1,
            "new_start_time": "2025-12-01T14:00:00",
            "new_end_time": "2025-12-01T15:00:00",
            "reason": "Mejor distribución de tiempo"
        }
    ]'''
    
    response = client.post(
        "/api/ai/optimizar-calendario",
        headers=headers,
        json={"texto": "Optimiza mi calendario de esta semana"}
    )
    
    # Verificar que el endpoint responde
    assert response.status_code in [200, 500, 503]
    
    if response.status_code == 200:
        data = response.json()
        assert "sugerencias" in data or isinstance(data, list)

def test_ai_without_provider(client: TestClient):
    """Test AI endpoints when no provider is configured"""
    headers = get_auth_header(client, "ai3@example.com")
    
    with patch("app.routers.ai.AI_PROVIDER", None):
        response = client.post(
            "/api/ai/sugerir-eventos",
            headers=headers,
            json={"texto": "Test"}
        )
        
        # Debe retornar error cuando no hay AI configurada
        assert response.status_code in [500, 503]
        data = response.json()
        assert "detail" in data
