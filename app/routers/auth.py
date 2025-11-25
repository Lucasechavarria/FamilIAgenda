import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import timedelta

from ..database import get_session 
from ..models import User, Family, FamilyMember
from ..schemas import UserCreate, UserLogin, Token
from ..security import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user_id

router = APIRouter()

@router.post("/register", response_model=Token, summary="Registra un nuevo usuario")
def register_new_user(user_data: UserCreate, session: Session = Depends(get_session)):
    # 1. Verificar si el email ya existe
    existing_user = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El email ya está registrado.")
    
    # 2. Crear el usuario
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    # 3. Lógica de Familia (Crear o Unirse)
    if user_data.create_family_name:
        # Crear nueva familia
        invitation_code = str(uuid.uuid4())[:6].upper()
        new_family = Family(name=user_data.create_family_name, invitation_code=invitation_code)
        session.add(new_family)
        session.commit()
        session.refresh(new_family)
        
        # Añadir usuario como admin
        member = FamilyMember(family_id=new_family.id, user_id=db_user.id, role="admin")
        session.add(member)
        session.commit()
        
    elif user_data.join_family_code:
        # Unirse a familia existente
        family = session.exec(select(Family).where(Family.invitation_code == user_data.join_family_code)).first()
        if not family:
            # No fallamos el registro, pero avisamos o simplemente no lo unimos (aquí simplificamos)
            print(f"Advertencia: Código de familia {user_data.join_family_code} no encontrado.")
        else:
            member = FamilyMember(family_id=family.id, user_id=db_user.id, role="member")
            session.add(member)
            session.commit()

    # 4. Generar Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(db_user.id), "email": db_user.email},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_name": db_user.full_name,
        "user_email": db_user.email
    }

@router.post("/token", response_model=Token, summary="Inicia sesión")
def login_for_access_token(form_data: UserLogin, session: Session = Depends(get_session)):
    try:
        user = session.exec(select(User).where(User.email == form_data.email)).first()
        
        if not user or not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email o contraseña incorrectos")
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user_name": user.full_name,
            "user_email": user.email
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/family/members", response_model=list[dict], summary="Obtener miembros de la familia del usuario actual")
def get_family_members(
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id)
):
    # Obtener family_id
    member = session.exec(select(FamilyMember).where(FamilyMember.user_id == current_user_id)).first()
    if not member:
        raise HTTPException(status_code=400, detail="No perteneces a una familia")
        
    # Obtener miembros
    members = session.exec(
        select(User)
        .join(FamilyMember)
        .where(FamilyMember.family_id == member.family_id)
    ).all()
    
    return [{"id": m.id, "full_name": m.full_name, "avatar_url": m.avatar_url} for m in members]
