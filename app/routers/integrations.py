import os
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from datetime import datetime
import json

from ..database import get_session
from ..security import get_current_user_id
from ..models import User, Event

router = APIRouter()

# Configuración de Google OAuth
# Asegúrate de tener el archivo client_secret.json en la raíz o configurar las variables de entorno
CLIENT_SECRETS_FILE = "client_secret.json" 
SCOPES = ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly']
REDIRECT_URI = "http://localhost:8000/api/integrations/google/callback"

@router.get("/google/auth")
def google_auth(user_id: int = Depends(get_current_user_id)):
    """Inicia el flujo de OAuth2 para Google Calendar"""
    if not os.path.exists(CLIENT_SECRETS_FILE):
        raise HTTPException(status_code=500, detail="Falta configuración de Google (client_secret.json)")

    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    
    # Pasamos el user_id en el estado para recuperarlo en el callback
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        state=str(user_id)
    )
    
    return {"auth_url": authorization_url}

@router.get("/google/callback")
async def google_auth_callback(request: Request, session: Session = Depends(get_session)):
    """Callback de Google OAuth2"""
    state = request.query_params.get("state")
    if not state:
        raise HTTPException(status_code=400, detail="Estado no válido")
        
    user_id = int(state)
    
    if not os.path.exists(CLIENT_SECRETS_FILE):
        raise HTTPException(status_code=500, detail="Falta configuración de Google")

    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    
    # Intercambiar código por token
    flow.fetch_token(authorization_response=str(request.url))
    credentials = flow.credentials
    
    # Guardar credenciales en el usuario (simplificado, idealmente en tabla separada o encriptado)
    # Aquí asumimos que podríamos guardar el token en un campo del usuario o una tabla de integraciones
    # Por ahora, retornamos éxito. En producción: guardar refresh_token.
    
    # TODO: Crear tabla UserIntegration para guardar tokens de forma segura
    
    # Redirigir al frontend con indicador de éxito
    return RedirectResponse(url="http://localhost:5173/settings?google_auth=success")

@router.post("/google/sync")
def sync_google_calendar(
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """Sincroniza eventos desde Google Calendar (Demo)"""
    # Aquí necesitaríamos recuperar las credenciales guardadas del usuario
    # Como no tenemos persistencia de tokens aún, este endpoint es un placeholder
    # para la lógica de sincronización.
    
    return {"message": "Sincronización iniciada (requiere persistencia de tokens)"}
