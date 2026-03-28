"""
Módulo centralizado de dependencias inyectables con FastAPI `Depends`.

Este módulo elimina la duplicación de lógica de autenticación y autorización
entre los distintos routers, siguiendo el principio DRY (Don't Repeat Yourself).

Uso:
    from ..dependencies import get_current_user, get_current_family_id

    @router.get("/me")
    def get_me(current_user: Annotated[User, Depends(get_current_user)]):
        ...
"""
from typing import Annotated, Generator

from fastapi import Depends, HTTPException, status
from sqlmodel import Session, select

from .database import get_session
from .models import User, FamilyMember
from .security import get_current_user_id


# ---------------------------------------------------------------------------
# Alias semántico de la sesión de base de datos
# ---------------------------------------------------------------------------

DBSession = Annotated[Session, Depends(get_session)]
"""
Tipo anotado para inyectar la sesión de base de datos en un endpoint.

Ejemplo::

    @router.get("/items")
    def list_items(session: DBSession):
        ...
"""


# ---------------------------------------------------------------------------
# Dependencia de usuario autenticado (objeto completo)
# ---------------------------------------------------------------------------

async def get_current_user(
    session: DBSession,
    user_id: Annotated[int, Depends(get_current_user_id)],
) -> User:
    """
    Dependencia que valida el JWT y devuelve el objeto `User` completo
    desde la base de datos.

    Raises:
        HTTPException 401: Si el token es inválido (manejado upstream por
                           `get_current_user_id`).
        HTTPException 404: Si el `user_id` del token no existe en la DB.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario autenticado no encontrado en la base de datos.",
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
"""
Tipo anotado para inyectar el usuario autenticado completo.

Ejemplo::

    @router.get("/profile")
    def get_profile(current_user: CurrentUser):
        return current_user
"""


# ---------------------------------------------------------------------------
# Dependencia de familia activa del usuario
# ---------------------------------------------------------------------------

async def get_current_family_id(
    current_user: CurrentUser,
    session: DBSession,
) -> int:
    """
    Dependencia que obtiene el `family_id` de la primera familia activa
    del usuario autenticado.

    Esta dependencia centraliza la lógica que antes estaba duplicada como
    una función helper en cada router individual.

    Raises:
        HTTPException 400: Si el usuario no pertenece a ninguna familia.
    """
    member = session.exec(
        select(FamilyMember).where(FamilyMember.user_id == current_user.id)
    ).first()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario no pertenece a ninguna familia. Crea o únete a una para continuar.",
        )
    return member.family_id


CurrentFamilyId = Annotated[int, Depends(get_current_family_id)]
"""
Tipo anotado para inyectar el `family_id` del usuario autenticado.

Ejemplo::

    @router.get("/tasks")
    def list_tasks(family_id: CurrentFamilyId, session: DBSession):
        ...
"""


# ---------------------------------------------------------------------------
# Dependencia de verificación de membresía familiar (para endpoints de familia)
# ---------------------------------------------------------------------------

def require_family_member(family_id_param: int):
    """
    Factory de dependencia que verifica si el usuario autenticado es miembro
    de una familia específica pasada como parámetro de ruta.

    Uso en decorator::

        @router.get("/family/{family_id}/events")
        def get_family_events(
            family_id: int,
            _: Annotated[None, Depends(require_family_member(family_id))],
        ):
            ...

    Nota: Para casos más simples, usar `CurrentFamilyId` directamente.
    """
    async def _check(
        current_user: CurrentUser,
        session: DBSession,
    ) -> None:
        membership = session.exec(
            select(FamilyMember)
            .where(FamilyMember.family_id == family_id_param)
            .where(FamilyMember.user_id == current_user.id)
        ).first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No eres miembro de la familia con ID {family_id_param}.",
            )
    return _check
