from sqlmodel import SQLModel, create_engine
from app.models import User, Family, FamilyMember, Event, Task, ChatMessage, NotificationLog, NotificationToken, EventShare, TaskAssignmentHistory
from app.database import DATABASE_URL

def init_db():
    print(f"Initializing DB at {DATABASE_URL}")
    engine = create_engine(DATABASE_URL)
    SQLModel.metadata.create_all(engine)
    print("Tables created successfully!")

if __name__ == "__main__":
    init_db()
