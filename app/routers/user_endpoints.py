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
