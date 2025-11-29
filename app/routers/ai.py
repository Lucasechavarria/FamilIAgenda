import os
import json
import re
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
import google.generativeai as genai
from dotenv import load_dotenv
from sqlmodel import Session, select, or_

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Advertencia: GEMINI_API_KEY no encontrada.")
else:
    genai.configure(api_key=api_key)  # type: ignore

from ..schemas import PromptUsuario
from ..database import get_session
from ..security import get_current_user_id
from ..models import Event, FamilyMember, EventShare

router = APIRouter()

@router.post("/interpretar", summary="Interpreta texto de usuario para crear un evento")
async def procesar_texto_ia(prompt: PromptUsuario):
    print(f"🤖 Recibida solicitud de IA: {prompt.texto[:50]}...")
    
    if not api_key:
        print("❌ GEMINI_API_KEY no está configurada")
        raise HTTPException(status_code=500, detail="La API Key de Gemini no está configurada.")
    
    print(f"✅ API Key presente: {api_key[:10]}...")

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')  # type: ignore
        ahora = datetime.now().isoformat()

        system_prompt = f"""
        Actúa como un asistente de calendario experto. La fecha y hora actual es: {ahora}.
        Tu tarea es convertir el texto del usuario en un objeto JSON estricto con los campos "title", "start_time", "end_time", "category", "description".
        Texto del usuario: "{prompt.texto}"
        IMPORTANTE: Devuelve SOLO el JSON.
        """
        
        print("📡 Enviando request a Gemini...")
        response = model.generate_content(system_prompt)
        print(f"✅ Respuesta recibida: {response.text[:100]}...")
        
        texto_limpio = response.text.replace("```json", "").replace("```", "").strip()
        resultado = json.loads(texto_limpio)
        print(f"✅ JSON parseado correctamente")
        return resultado
        
    except json.JSONDecodeError as e:
        print(f"❌ Error parseando JSON: {str(e)}")
        print(f"   Texto recibido: {texto_limpio}")
        raise HTTPException(status_code=500, detail=f"La IA no devolvió un JSON válido: {str(e)}")
    except Exception as e:
        print(f"❌ Error general en IA: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al procesar con IA: {type(e).__name__}: {str(e)}")


@router.post("/suggest-time", summary="Sugiere mejor horario para un evento usando IA")
async def suggest_optimal_time(
    prompt: PromptUsuario,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Analiza los eventos existentes del usuario y sugiere el mejor horario
    para un nuevo evento, evitando conflictos y considerando patrones.
    """
    if not api_key:
        raise HTTPException(status_code=500, detail="La API Key de Gemini no está configurada.")
        
    try:
        # Obtener eventos del usuario (próximos 7 días)
        now = datetime.utcnow()
        week_later = now + timedelta(days=7)
        
        # Obtener familias del usuario
        family_ids = session.exec(
            select(FamilyMember.family_id).where(FamilyMember.user_id == user_id)
        ).all()
        
        # Obtener eventos compartidos
        shared_event_ids = session.exec(
            select(EventShare.event_id).where(EventShare.shared_with_user_id == user_id)
        ).all()
        
        # Query de eventos
        events = session.exec(
            select(Event).where(
                or_(
                    Event.owner_id == user_id,
                    Event.family_id.in_(family_ids), # type: ignore
                    Event.id.in_(shared_event_ids) # type: ignore
                )
            ).where(
                Event.start_time >= now,
                Event.start_time <= week_later
            )
        ).all()
        
        # Construir contexto para Gemini
        events_context = "\n".join([
            f"- {e.title}: {e.start_time.strftime('%Y-%m-%d %H:%M')} a {e.end_time.strftime('%H:%M')} ({e.category})"
            for e in events
        ])
        
        prompt_text = f"""Eres un asistente de calendario inteligente. El usuario quiere programar: "{prompt.texto}"

Eventos ya programados en los próximos 7 días:
{events_context if events_context else "No hay eventos programados"}

Analiza:
1. Conflictos de horario
2. Patrones de actividad (ej: si hay muchos eventos de trabajo por la mañana)
3. Tiempo de descanso entre eventos
4. Categoría del evento solicitado

Responde SOLO en formato JSON:
{{
  "suggested_time": "YYYY-MM-DD HH:MM",
  "duration_minutes": 60,
  "reason": "Breve explicación de por qué este horario es óptimo",
  "alternative_times": ["YYYY-MM-DD HH:MM", "YYYY-MM-DD HH:MM"]
}}"""

        # Llamar a Gemini
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt_text)
        
        # Parsear respuesta JSON
        # Extraer JSON de la respuesta (puede venir con markdown)
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if json_match:
            suggestion = json.loads(json_match.group())
            return suggestion
        else:
            raise ValueError("No se pudo parsear la respuesta de Gemini")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al sugerir horario: {str(e)}")

@router.post("/analyze-routine", summary="Analiza rutinas y tareas para optimización")
async def analyze_routine(
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Analiza las tareas pendientes y eventos próximos para detectar:
    1. Superposiciones
    2. Sobrecarga de trabajo
    3. Sugerencias de optimización
    """
    if not api_key:
        raise HTTPException(status_code=500, detail="La API Key de Gemini no está configurada.")

    # Obtener tareas pendientes
    family_id = session.exec(select(FamilyMember.family_id).where(FamilyMember.user_id == user_id)).first()
    
    from ..models import Task
    tasks = session.exec(select(Task).where(Task.family_id == family_id, Task.status == "pending")).all()
    
    # Obtener eventos próximos (3 días)
    now = datetime.utcnow()
    three_days = now + timedelta(days=3)
    events = session.exec(select(Event).where(Event.start_time >= now, Event.start_time <= three_days)).all() # Simplificado para demo
    
    context = "Tareas Pendientes:\n" + "\n".join([f"- {t.title} (Vence: {t.due_date})" for t in tasks])
    context += "\n\nEventos Próximos:\n" + "\n".join([f"- {e.title} ({e.start_time})" for e in events])
    
    prompt = f"""
    Analiza la siguiente rutina familiar y detecta problemas.
    {context}
    
    Busca:
    1. Superposiciones horarias (Eventos vs Tareas con hora fija).
    2. Sobrecarga (Demasiadas cosas en un solo día).
    3. Sugerencias (Ej: "Agrupar compras").
    
    Responde en JSON:
    {{
        "alerts": ["Alerta 1", "Alerta 2"],
        "suggestions": ["Sugerencia 1", "Sugerencia 2"],
        "score": 85 (0-100 salud de rutina)
    }}
    """
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        return {"alerts": [], "suggestions": ["No se pudo analizar."], "score": 0}
    except Exception as e:
        print(f"Error AI: {e}")
        return {"alerts": [], "suggestions": ["Error en servicio de IA"], "score": 0}
