from sqlmodel import SQLModel, create_engine, Session
from typing import Generator
import os
from dotenv import load_dotenv

load_dotenv()

# Obtener URL de base de datos o usar SQLite por defecto
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")

# Si usamos PostgreSQL, asegurarnos de que empiece con postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configuración del motor
connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args["check_same_thread"] = False
elif "pgbouncer=true" in DATABASE_URL:
    # Connection Pooler requiere prepared statements deshabilitados
    connect_args["prepare_threshold"] = 0

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)

def create_db_and_tables():
    # En producción con Supabase, las tablas ya deberían existir por el script SQL.
    # SQLModel solo creará las que falten, pero es mejor confiar en las migraciones/scripts SQL.
    SQLModel.metadata.create_all(engine)
    migrate_db_schema()

def migrate_db_schema():
    """
    Función simple de migración para agregar columnas faltantes en producción.
    Esto es necesario porque SQLModel.metadata.create_all no altera tablas existentes.
    """
    from sqlalchemy import text
    
    with Session(engine) as session:
        try:
            # 1. Tabla User: agregar 'color'
            session.exec(text("ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS color VARCHAR DEFAULT '#3B82F6'"))
            
            # 2. Tabla NotificationLog: agregar 'title', 'body', 'status'
            session.exec(text("ALTER TABLE notificationlog ADD COLUMN IF NOT EXISTS title VARCHAR DEFAULT 'Notificación'"))
            session.exec(text("ALTER TABLE notificationlog ADD COLUMN IF NOT EXISTS body VARCHAR DEFAULT ''"))
            session.exec(text("ALTER TABLE notificationlog ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending'"))
            
            # 3. Tabla Task: agregar 'created_by_id', 'completed_by_id'
            # Nota: created_by_id es NOT NULL en el modelo, pero al agregarla a tabla existente debe permitir NULL o tener default
            # Aquí permitimos NULL temporalmente para no romper datos existentes
            session.exec(text("ALTER TABLE task ADD COLUMN IF NOT EXISTS created_by_id INTEGER REFERENCES \"user\"(id)"))
            session.exec(text("ALTER TABLE task ADD COLUMN IF NOT EXISTS completed_by_id INTEGER REFERENCES \"user\"(id)"))
            
            # 4. Tabla NotificationToken: agregar 'device_info'
            session.exec(text("ALTER TABLE notificationtoken ADD COLUMN IF NOT EXISTS device_info VARCHAR"))
            
            session.commit()
            print("✅ Schema migration completed successfully")
        except Exception as e:
            print(f"⚠️ Schema migration failed (might be already applied): {e}")
            session.rollback()

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

def SessionLocal():
    """Factory function for creating sessions in background tasks"""
    return Session(engine)
