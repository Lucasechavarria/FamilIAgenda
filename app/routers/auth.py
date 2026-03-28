from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..database import get_session
from ..dependencies import CurrentUser, DBSession
from ..models import User, Family, FamilyMember
from ..schemas import (
    FamilyMemberRead,
    JoinFamily,
    Token,
    UserLogin,
    UserRead,
    UserRegister,
    UserUpdate,
)
from ..security import (
    create_access_token,
    get_current_user_id,
    get_password_hash,
    verify_password,
)
import secrets
import string

router = APIRouter()

# Los schemas UserRegister y UserLogin están centralizados en app/schemas.py

@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Registro de nuevo usuario",
    description=(
        "Crea una cuenta nueva para un usuario. Opcionalmente puede crear una nueva "
        "familia o unirse a una existente mediante el campo `family_name`. "
        "Retorna un token JWT listo para usar en los demás endpoints."
    ),
)
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
async def register_slash(user: UserRegister, session: DBSession):
    return await register(user, session)

@router.post(
    "/token",
    response_model=Token,
    summary="Iniciar sesión (obtener JWT)",
    description=(
        "Autentica al usuario con email y contraseña. Retorna un token JWT Bearer "
        "que debe enviarse en el header `Authorization: Bearer <token>` para acceder "
        "a los endpoints protegidos. El token expira en **24 horas**."
    ),
)
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

@router.post("/token/", include_in_schema=False)
async def login_slash(user: UserLogin, session: DBSession):
    return await login(user, session)

@router.get(
    "/familia/miembros",
    response_model=List[FamilyMemberRead],
    summary="Listar miembros de la familia",
    description=(
        "Retorna la lista de todos los miembros de la familia a la que pertenece "
        "el usuario autenticado. Incluye nombre, email, avatar y color personal de cada miembro."
    ),
)
async def get_family_members(
    session: DBSession,
    current_user: CurrentUser,
):
    # Obtener familia del usuario
    member = session.exec(
        select(FamilyMember).where(FamilyMember.user_id == current_user.id)
    ).first()

    if not member:
        return []

    # Obtener todos los miembros de la familia
    members = session.exec(
        select(User)
        .join(FamilyMember)
        .where(FamilyMember.family_id == member.family_id)
    ).all()

    return [
        FamilyMemberRead(
            id=m.id,
            full_name=m.full_name,
            email=m.email,
            avatar_url=m.avatar_url,
            color=m.color,
        )
        for m in members
    ]

@router.get(
    "/me",
    response_model=UserRead,
    summary="Obtener perfil del usuario autenticado",
    description=(
        "Retorna la información del perfil del usuario que realiza la solicitud, "
        "identificado a través del token JWT. Incluye ID, email, nombre y color personal."
    ),
)
async def get_current_user_info(
    current_user: CurrentUser,
):
    return UserRead(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        avatar_url=current_user.avatar_url,
        color=current_user.color,
    )

@router.patch(
    "/me",
    response_model=UserRead,
    summary="Actualizar perfil del usuario autenticado",
    description=(
        "Actualiza los campos del perfil del usuario autenticado. "
        "Acepta `full_name`, `avatar_url` y `color` (formato hex #RRGGBB). "
        "Solo se actualizan los campos enviados (PATCH parcial)."
    ),
)
async def update_current_user(
    update_data: UserUpdate,
    session: DBSession,
    current_user: CurrentUser,
):
    # Aplicar solo los campos enviados (exclude_unset para PATCH real)
    data = update_data.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(current_user, field, value)

    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return UserRead(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        avatar_url=current_user.avatar_url,
        color=current_user.color,
    )
