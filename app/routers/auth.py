from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..database import get_session
from ..models import User, Family, FamilyMember
from ..security import get_password_hash, verify_password, create_access_token, get_current_user_id
from pydantic import BaseModel
import secrets
import string

router = APIRouter()

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    family_name: str = ""

class UserLogin(BaseModel):
    email: str
    password: str

@router.post("/register")
async def register(user: UserRegister, session: Session = Depends(get_session)):
    # Verificar si el usuario ya existe
    existing_user = session.exec(select(User).where(User.email == user.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # Crear usuario
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    # Crear o unirse a familia
    if user.family_name:
        # Buscar familia existente
        family = session.exec(select(Family).where(Family.name == user.family_name)).first()
        
        if not family:
            # Crear nueva familia
            invitation_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
            new_family = Family(name=user.family_name, invitation_code=invitation_code)
            session.add(new_family)
            session.commit()
            session.refresh(new_family)
            
            # Agregar usuario como admin
            member = FamilyMember(family_id=new_family.id, user_id=db_user.id, role="admin")
            session.add(member)
            session.commit()
        else:
            # Unirse a familia existente
            member = FamilyMember(family_id=family.id, user_id=db_user.id, role="member")
            session.add(member)
            session.commit()
    
    # Crear token
    access_token = create_access_token(data={"sub": str(db_user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_name": db_user.full_name,
        "user_email": db_user.email
    }

@router.post("/register/", include_in_schema=False)
async def register_slash(user: UserRegister, session: Session = Depends(get_session)):
    return await register(user, session)

@router.post("/token")
async def login(user: UserLogin, session: Session = Depends(get_session)):
    # Buscar usuario
    db_user = session.exec(select(User).where(User.email == user.email)).first()
    
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    # Crear token
    access_token = create_access_token(data={"sub": str(db_user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_name": db_user.full_name,
        "user_email": db_user.email
    }

@router.get("/familia/miembros")
async def get_family_members(
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """Obtener miembros de la familia del usuario"""
    # Obtener familia del usuario
    member = session.exec(select(FamilyMember).where(FamilyMember.user_id == user_id)).first()
    
    if not member:
        return []
    
    # Obtener todos los miembros de la familia
    members = session.exec(
        select(User)
        .join(FamilyMember)
        .where(FamilyMember.family_id == member.family_id)
    ).all()
    
    return [
        {
            "id": m.id,
            "full_name": m.full_name,
            "email": m.email,
            "avatar_url": m.avatar_url,
            "color": m.color
        }
        for m in members
    ]

@router.get("/me")
async def get_current_user_info(
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """Obtener información del usuario actual"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "color": user.color
    }

@router.patch("/me")
async def update_current_user(
    update_data: dict,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """Actualizar información del usuario actual"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Actualizar color si está presente
    if "color" in update_data:
        # Validar formato de color hex
        color = update_data["color"]
        if not (isinstance(color, str) and len(color) == 7 and color.startswith("#")):
            raise HTTPException(status_code=400, detail="Formato de color inválido. Use formato hex: #RRGGBB")
        user.color = color
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return {
        "message": "Usuario actualizado exitosamente",
        "color": user.color
    }
