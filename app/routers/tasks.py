"""
Router de Tareas — CRUD completo para gestión de responsabilidades familiares.

Las tareas son unidades de trabajo asignables a miembros de la familia.
Todos los endpoints requieren autenticación JWT y que el usuario pertenezca
a una familia activa.
"""
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from ..database import get_session
from ..dependencies import CurrentFamilyId, DBSession
from ..models import Task, FamilyMember
from ..schemas import TaskCreate, TaskRead, TaskUpdate
from ..security import get_current_user_id
from datetime import datetime, timezone

router = APIRouter()


# =============================================================================
# ── CRUD Base ─────────────────────────────────────────────────────────────────
# =============================================================================

@router.post(
    "/",
    response_model=TaskRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una nueva tarea",
    description=(
        "Crea una tarea y la asocia a la familia del usuario autenticado. "
        "Opcionalmente puede asignarse a un miembro específico mediante `assigned_to_id`; "
        "en ese caso, se verifica que el destinatario pertenezca a la misma familia. "
        "La tarea se crea con estado `pending` por defecto."
    ),
)
def create_task(
    task: TaskCreate,
    session: DBSession,
    user_id: Annotated[int, Depends(get_current_user_id)],
    family_id: CurrentFamilyId,
):
    # Validar asignación: el destinatario debe ser de la misma familia
    if task.assigned_to_id:
        assigned_member = session.exec(
            select(FamilyMember).where(
                FamilyMember.user_id == task.assigned_to_id,
                FamilyMember.family_id == family_id,
            )
        ).first()
        if not assigned_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El usuario asignado no pertenece a tu familia.",
            )

    task_data = task.model_dump()
    task_data["family_id"] = family_id
    task_data["created_by_id"] = user_id
    task_data["status"] = "pending"

    db_task = Task.model_validate(task_data)
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task


@router.get(
    "/",
    response_model=List[TaskRead],
    summary="Listar tareas de la familia",
    description=(
        "Retorna todas las tareas de la familia del usuario autenticado, "
        "ordenadas por fecha de vencimiento (las más próximas primero). "
        "Permite filtrar por estado mediante el parámetro `status`."
    ),
)
def read_tasks(
    session: DBSession,
    user_id: Annotated[int, Depends(get_current_user_id)],
    family_id: CurrentFamilyId,
    task_status: Annotated[
        Optional[str],
        Query(
            alias="status",
            description="Filtrar por estado: `pending`, `in_progress`, `completed`, `cancelled`.",
        ),
    ] = None,
):
    query = select(Task).where(Task.family_id == family_id)

    if task_status:
        query = query.where(Task.status == task_status)

    # Ordenar por fecha de vencimiento (nulos al final)
    query = query.order_by(Task.due_date)

    tasks = session.exec(query).all()
    return tasks


@router.get(
    "/{task_id}",
    response_model=TaskRead,
    summary="Obtener una tarea por ID",
    description=(
        "Retorna los detalles completos de una tarea específica. "
        "Solo es accesible si la tarea pertenece a la familia del usuario autenticado."
    ),
)
def read_task(
    task_id: int,
    session: DBSession,
    user_id: Annotated[int, Depends(get_current_user_id)],
    family_id: CurrentFamilyId,
):
    task = session.get(Task, task_id)
    if not task or task.family_id != family_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada.")
    return task


@router.patch(
    "/{task_id}",
    response_model=TaskRead,
    summary="Actualizar una tarea (PATCH parcial)",
    description=(
        "Actualiza parcialmente los campos de una tarea existente. "
        "La tarea debe pertenecer a la familia del usuario autenticado. "
        "Enviar solo los campos que se desean cambiar."
    ),
)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    session: DBSession,
    user_id: Annotated[int, Depends(get_current_user_id)],
    family_id: CurrentFamilyId,
):
    db_task = session.get(Task, task_id)
    if not db_task or db_task.family_id != family_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada.")

    task_data = task_update.model_dump(exclude_unset=True)
    for key, value in task_data.items():
        setattr(db_task, key, value)

    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task


@router.post(
    "/{task_id}/complete",
    response_model=TaskRead,
    summary="Marcar tarea como completada",
    description=(
        "Marca una tarea como completada y registra la fecha de finalización "
        "y el usuario que la completó. La tarea debe pertenecer a la familia del usuario. "
        "Cualquier miembro de la familia puede completar una tarea."
    ),
)
def complete_task(
    task_id: int,
    session: DBSession,
    user_id: Annotated[int, Depends(get_current_user_id)],
    family_id: CurrentFamilyId,
):
    db_task = session.get(Task, task_id)
    if not db_task or db_task.family_id != family_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada.")

    db_task.status = "completed"
    db_task.completed_at = datetime.now(timezone.utc)
    db_task.completed_by_id = user_id

    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar una tarea",
    description=(
        "Elimina permanentemente una tarea de la familia. "
        "La tarea debe pertenecer a la familia del usuario autenticado. "
        "Esta operación **no se puede deshacer**."
    ),
)
def delete_task(
    task_id: int,
    session: DBSession,
    user_id: Annotated[int, Depends(get_current_user_id)],
    family_id: CurrentFamilyId,
):
    db_task = session.get(Task, task_id)
    if not db_task or db_task.family_id != family_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada.")

    session.delete(db_task)
    session.commit()
    return None
