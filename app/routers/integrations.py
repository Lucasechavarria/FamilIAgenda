import os
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from datetime import datetime, timezone
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
    
    # 1. Guardar o actualizar la integración del usuario
    from ..models import UserIntegration
    
    # Convertir scopes a JSON string
    scopes_str = json.dumps(credentials.scopes)
    
    # Buscar si ya existe una integración
    statement = select(UserIntegration).where(
        UserIntegration.user_id == user_id, 
        UserIntegration.provider == "google"
    )
    integration = session.exec(statement).first()
    
    if not integration:
        integration = UserIntegration(
            user_id=user_id,
            provider="google",
            access_token=credentials.token,
            refresh_token=credentials.refresh_token,
            expires_at=credentials.expiry.replace(tzinfo=timezone.utc) if credentials.expiry else datetime.now(timezone.utc),
            scopes=scopes_str
        )
        session.add(integration)
    else:
        integration.access_token = credentials.token
        if credentials.refresh_token:
            integration.refresh_token = credentials.refresh_token
        integration.expires_at = credentials.expiry.replace(tzinfo=timezone.utc) if credentials.expiry else datetime.now(timezone.utc)
        integration.scopes = scopes_str
        session.add(integration)
    
    session.commit()
    
    # Redirigir al frontend con indicador de éxito
    return RedirectResponse(url="http://localhost:5173/settings?google_auth=success")

def get_google_credentials(user_id: int, session: Session):
    """Recupera y refresca las credenciales de Google para un usuario"""
    from ..models import UserIntegration
    
    statement = select(UserIntegration).where(
        UserIntegration.user_id == user_id, 
        UserIntegration.provider == "google"
    )
    integration = session.exec(statement).first()
    
    if not integration:
        return None
        
    creds = Credentials(
        token=integration.access_token,
        refresh_token=integration.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"), # Debería estar en env
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        scopes=json.loads(integration.scopes)
    )
    
    # Verificar si expiró y refrescar
    if integration.expires_at < datetime.now(timezone.utc):
        from google.auth.transport.requests import Request as GoogleRequest
        creds.refresh(GoogleRequest())
        
        # Actualizar en DB
        integration.access_token = creds.token
        integration.expires_at = creds.expiry.replace(tzinfo=timezone.utc) if creds.expiry else datetime.now(timezone.utc)
        session.add(integration)
        session.commit()
        
    return creds

@router.post("/google/sync")
def sync_google_calendar(
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """Sincroniza eventos desde Google Calendar e inserta en la DB local"""
    creds = get_google_credentials(user_id, session)
    if not creds:
        raise HTTPException(status_code=400, detail="Google no conectado")
        
    try:
        service = build('calendar', 'v3', credentials=creds)
        
        # Obtener eventos desde ahora
        now_iso = datetime.now(timezone.utc).isoformat()
        events_result = service.events().list(
            calendarId='primary', 
            timeMin=now_iso,
            maxResults=15, 
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        google_events = events_result.get('items', [])
        
        imported_count = 0
        from ..models import Event
        
        for g_event in google_events:
            # Evitar duplicados por título y fecha (lógica simple)
            start_str = g_event['start'].get('dateTime', g_event['start'].get('date'))
            start_dt = datetime.fromisoformat(start_str.replace('Z', '+00:00'))
            
            # Verificar si ya existe este evento
            # (En producción usaríamos un iCalUID o un campo external_id)
            stmt = select(Event).where(
                Event.owner_id == user_id,
                Event.title == g_event['summary'],
                Event.start_time == start_dt
            )
            exists = session.exec(stmt).first()
            
            if not exists:
                new_event = Event(
                    title=g_event['summary'],
                    description=g_event.get('description', 'Sincronizado de Google'),
                    start_time=start_dt,
                    end_time=datetime.fromisoformat(g_event['end'].get('dateTime', g_event['end'].get('date')).replace('Z', '+00:00')),
                    owner_id=user_id,
                    family_id=1, # TODO: Obtener familia del usuario real
                    category="google_sync"
                )
                session.add(new_event)
                imported_count += 1
                
        session.commit()
        return {
            "status": "success", 
            "message": f"Se han importado {imported_count} eventos nuevos de Google Calendar."
        }
        
    except Exception as e:
        print(f"Error en sincronización: {e}")
        raise HTTPException(status_code=500, detail=str(e))
