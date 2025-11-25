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

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
