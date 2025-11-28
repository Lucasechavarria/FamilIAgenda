from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
 
from sqlmodel import Session, select
from .database import create_db_and_tables, engine
from .models import Family
from .security import get_password_hash
from .notification_service import initialize_firebase_app
from .routers import auth, ai, notifications, events, tasks, sharing, chat

import asyncio
from apscheduler.schedulers.background import BackgroundScheduler
from .services.background_tasks import check_upcoming_tasks
from .services.notification_scheduler import process_pending_notifications
from .database import SessionLocal

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

# Crear instancia de FastAPI
app = FastAPI(
    title="FamilIAgenda API",
    description="API para gestión familiar inteligente",
    version="1.0.0",
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todos los orígenes temporalmente
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware de Logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import time

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

# Exception Handler para 422
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"❌  VALIDATION ERROR: {exc.errors()}")
    print(f"    Body: {exc.body}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": str(exc.body)},
    )

# Ruta raíz
@app.get("/")
async def root():
    return {"message": "FamilIAgenda API - Funcionando correctamente"}

# --- Inclusión de Routers ---
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticación"])
app.include_router(ai.router, prefix="/api/ai", tags=["Inteligencia Artificial"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notificaciones"])
app.include_router(events.router, prefix="/api/events", tags=["Eventos"])
# app.include_router(sharing.router, prefix="/api", tags=["Compartir Eventos"])
# app.include_router(integrations.router, prefix="/api/integrations", tags=["Integraciones"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["Tareas"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
