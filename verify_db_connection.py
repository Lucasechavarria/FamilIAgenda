import os
import sys
from sqlmodel import SQLModel, create_engine, Session, select
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.getcwd())

from app.models import User, Family

# Load env vars
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
is_pooler = "pgbouncer=true" in DATABASE_URL
mode = "Connection Pooler (Production)" if is_pooler else "Direct Connection (Development)"
print(f"Testing {mode}...")
print(f"Host: {DATABASE_URL.split('@')[1].split('/')[0] if '@' in DATABASE_URL else 'SQLite'}")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

try:
    engine = create_engine(DATABASE_URL)
    
    print("1. Attempting to connect to database...")
    with engine.connect() as connection:
        print("✅ Connection successful!")
        
    print("\n2. Attempting to create tables (if not exist)...")
    SQLModel.metadata.create_all(engine)
    print("✅ Tables checked/created!")
    
    print("\n3. Testing basic CRUD operations...")
    with Session(engine) as session:
        # Check if we can query
        families = session.exec(select(Family)).all()
        print(f"✅ Query successful! Found {len(families)} families.")
        
        users = session.exec(select(User)).all()
        print(f"✅ Query successful! Found {len(users)} users.")
        
    print("\n🎉 Database integration verified successfully!")
    
except Exception as e:
    print(f"\n❌ Error during database verification:")
    print(str(e))
    sys.exit(1)
