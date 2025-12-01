from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, or_

from ..database import get_session
from ..models import Task, FamilyMember, User
from ..schemas import TaskCreate, TaskRead, TaskUpdate
from ..security import get_current_user_id

router = APIRouter()

def get_current_family_id(session: Session, user_id: int) -> int:
    """Helper para obtener el family_id del usuario actual"""
    member = session.exec(select(FamilyMember).where(FamilyMember.user_id == user_id)).first()
    if not member:
        raise HTTPException(status_code=400, detail="El usuario no pertenece a ninguna familia")
    return member.family_id

@router.post("/", response_model=TaskRead)
def create_task(
    task: TaskCreate,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    family_id = get_current_family_id(session, user_id)
    
    # Validar asignación
    if task.assigned_to_id:
        # Verificar que el usuario asignado pertenezca a la misma familia
        assigned_member = session.exec(select(FamilyMember).where(
            FamilyMember.user_id == task.assigned_to_id,
            FamilyMember.family_id == family_id
        )).first()
        if not assigned_member:
             raise HTTPException(status_code=400, detail="El usuario asignado no pertenece a tu familia")

    task_data = task.model_dump()
    task_data["family_id"] = family_id
    task_data["created_by_id"] = user_id
    task_data["status"] = "pending"
    
    db_task = Task.model_validate(task_data)
    
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task

@router.get("/", response_model=List[TaskRead])
def read_tasks(
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id),
    status: Optional[str] = None
):
    family_id = get_current_family_id(session, user_id)
    
    query = select(Task).where(Task.family_id == family_id)
    
    if status:
        query = query.where(Task.status == status)
        
    # Ordenar por fecha de vencimiento
    query = query.order_by(Task.due_date)
    
    tasks = session.exec(query).all()
    return tasks

@router.get("/{task_id}", response_model=TaskRead)
def read_task(
    task_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    family_id = get_current_family_id(session, user_id)
    task = session.get(Task, task_id)
    if not task or task.family_id != family_id:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return task

@router.patch("/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    family_id = get_current_family_id(session, user_id)
    db_task = session.get(Task, task_id)
    if not db_task or db_task.family_id != family_id:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
        
    task_data = task_update.model_dump(exclude_unset=True)
    for key, value in task_data.items():
        setattr(db_task, key, value)
        
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task

@router.post("/{task_id}/complete", response_model=TaskRead)
def complete_task(
    task_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    family_id = get_current_family_id(session, user_id)
    db_task = session.get(Task, task_id)
    if not db_task or db_task.family_id != family_id:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
        
    db_task.status = "completed"
    db_task.completed_at = datetime.utcnow()
    db_task.completed_by_id = user_id
    
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    
    # TODO: Si es recurrente, generar la siguiente instancia aquí
    
    return db_task

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    family_id = get_current_family_id(session, user_id)
    db_task = session.get(Task, task_id)
    if not db_task or db_task.family_id != family_id:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
        
    session.delete(db_task)
    session.commit()
    return {"ok": True}
