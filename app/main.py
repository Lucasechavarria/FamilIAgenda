from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from contextlib import asynccontextmanager
from starlette.middleware.base import BaseHTTPMiddleware
import time
import asyncio

from sqlmodel import Session, select
from app.database import create_db_and_tables, engine, SessionLocal
from app.models import User, Family, FamilyMember, Event, Task, ChatMessage, NotificationLog, NotificationToken, EventShare, TaskAssignmentHistory
from app.security import get_password_hash
from app.notification_service import initialize_firebase_app
from app.routers import auth, ai, notifications, events, tasks, sharing, chat, metrics
from app.routers import search as search_router
from apscheduler.schedulers.background import BackgroundScheduler
from app.services.background_tasks import check_upcoming_tasks
from app.services.notification_scheduler import process_pending_notifications

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear tablas (opcional si DB no está disponible)
    try:
        create_db_and_tables()
        print("✅ Database tables verified/created")
    except Exception as e:
        print(f"⚠️  Database connection failed: {e}")
        print("   Backend will start without database (API endpoints available)")
    
    # Inicializar Firebase (si hay credenciales)
    try:
        initialize_firebase_app()
        print("✅ Firebase initialized")
    except Exception as e:
        print(f"⚠️  Firebase initialization failed: {e}")
    
    # Crear familia Admin si no existe (Demo)
    try:
        with Session(engine) as session:
            # ... (lógica existente de admin)
            pass
    except Exception as e:
        print(f"⚠️  Admin family creation skipped: {e}")
        
    # Iniciar scheduler de notificaciones
    scheduler = BackgroundScheduler()
    
    # Tarea cada 5 minutos: procesar notificaciones pendientes
    def notification_job():
        try:
            with SessionLocal() as session:
                process_pending_notifications(session)
        except Exception as e:
            print(f"Error en background task: {e}")
    
    scheduler.add_job(
        func=notification_job,
        trigger="interval",
        minutes=5,
        id="process_notifications",
        name="Process Pending Notifications"
    )
    
    scheduler.start()
    print("✅ Notification scheduler started (every 5 minutes)")
    
    # Mantener tarea existente de check_upcoming_tasks si existe
    try:
        asyncio.create_task(check_upcoming_tasks())
        print("✅ Background tasks started")
    except Exception as e:
        print(f"⚠️  Background tasks failed: {e}")
    
    print("\n🚀 FamilIAgenda API lista para operar")
    print("   Docs: http://localhost:8000/docs\n")
    
    # Debug: Imprimir todas las rutas registradas
    print("--- Rutas Registradas ---")
    for route in app.routes:
        if hasattr(route, "path"):
            methods = getattr(route, "methods", "N/A")
            print(f"{methods} {route.path}")
    print("-------------------------")
    
    yield
    # Shutdown
    scheduler.shutdown()
    print("Cerrando FamilIAgenda...")

_API_DESCRIPTION = """
## Bienvenido a la API de **FamilIAgenda** 🏠

Plataforma de gestión familiar inteligente que combina calendarios colaborativos,
gestión de tareas y **IA generativa** para simplificar la organización del hogar.

---

### 🔐 Autenticación

La API usa **JWT Bearer tokens**. Para obtener un token:
1. Registrate en `POST /api/auth/register`
2. Inicia sesión en `POST /api/auth/token`
3. Incluye el token en el header: `Authorization: Bearer <tu_token>`

### 📅 Módulos principales

| Módulo | Descripción |
|--------|-------------|
| **Auth** | Registro, login y gestión de perfil |
| **Eventos** | CRUD completo de eventos del calendario |
| **Tareas** | Gestión de responsabilidades familiares |
| **Chat** | Mensajería en tiempo real via WebSocket |
| **IA** | Creación de eventos por lenguaje natural |
| **Métricas** | Dashboard de productividad familiar |

### 📚 Notas de versión

Versión `1.0.0` — Marzo 2026
"""

_API_TAGS = [
    {"name": "Autenticación", "description": "Registro, login y gestión del perfil de usuario."},
    {"name": "Eventos", "description": "Creación, edición, eliminación y asignación de eventos del calendario."},
    {"name": "Tareas", "description": "Gestión de responsabilidades y tareas del hogar."},
    {"name": "Chat", "description": "Mensajería familiar en tiempo real mediante WebSockets."},
    {"name": "Inteligencia Artificial", "description": "Creación de eventos mediante interpretación de lenguaje natural (Groq/Gemini)."},
    {"name": "Métricas", "description": "Dashboard de productividad y estadísticas de la familia."},
    {"name": "Notificaciones", "description": "Gestión de tokens FCM y notificaciones push."},
]

# Crear instancia de FastAPI
app = FastAPI(
    title="FamilIAgenda API",
    description=_API_DESCRIPTION,
    version="1.0.0",
    contact={
        "name": "Equipo FamilIAgenda",
        "url": "https://famil-ia-genda.vercel.app",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    openapi_tags=_API_TAGS,
    lifespan=lifespan,
)

# Middleware de Logging
class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        print(f"➡️  INCOMING: {request.method} {request.url.path}")
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            print(f"⬅️  RESPONSE: {response.status_code} (took {process_time:.4f}s)")
            return response
        except Exception as e:
            print(f"❌  ERROR processing request: {e}")
            raise

app.add_middleware(LoggingMiddleware)

# Configurar CORS - Permitir dominios específicos
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
    "https://familiagenda-frontend.onrender.com",
    "https://familiagenda-backend.onrender.com",
    "https://famil-ia-genda.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://familiagenda-.*\.vercel\.app", 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Exception Handler para 422
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"❌  VALIDATION ERROR: {exc.errors()}")
    try:
        body = exc.body
        if isinstance(body, bytes):
            body = body.decode("utf-8")
    except Exception:
        body = str(exc.body)
        
    print(f"    Body: {body}")
    return JSONResponse(
        status_code=422,
        content={
            "detail": jsonable_encoder(exc.errors()), 
            "message": "Error de validación en los datos enviados",
            "body": body
        },
    )

# Exception Handler para 500 (Errores inesperados)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"🔥 UNHANDLED ERROR: {type(exc).__name__}: {str(exc)}")
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={
            "message": "Error interno del servidor",
            "detail": str(exc) if app.debug else "Ocurrió un error inesperado al procesar la solicitud.",
            "path": request.url.path
        }
    )

# Ruta raíz
@app.get("/")
async def root():
    return {"message": "FamilIAgenda API - Funcionando correctamente"}

# --- Inclusión de Routers ---
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticación"])
app.include_router(ai.router, prefix="/api/ai", tags=["Inteligencia Artificial"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notificaciones"])
app.include_router(metrics.router, prefix="/api/metrics", tags=["Métricas"])
app.include_router(events.router, prefix="/api/events", tags=["Eventos"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["Tareas"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(search_router.router, prefix="/api/search", tags=["Búsqueda Global"])

