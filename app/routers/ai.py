import os
import json
import re
from datetime import datetime, timedelta
from typing import AsyncGenerator
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from sqlmodel import Session, select, or_

load_dotenv()

# Intentar usar Groq primero (gratis y rápido), luego Gemini
groq_key = os.getenv("GROQ_API_KEY")
gemini_key = os.getenv("GEMINI_API_KEY")

AI_PROVIDER = None
groq_client = None

if groq_key:
    try:
        # Eliminar variables de proxy que pueden causar errores en la inicialización de Groq en Render
        # Render a veces inyecta proxies que la librería de Groq/httpx no maneja bien por defecto
        if "http_proxy" in os.environ:
            del os.environ["http_proxy"]
        if "https_proxy" in os.environ:
            del os.environ["https_proxy"]
            
        from groq import Groq
        groq_client = Groq(api_key=groq_key)
        AI_PROVIDER = "groq"
        print("✅ Usando Groq AI (gratis y rápido)")
    except Exception as e:
        print(f"⚠️ Error al inicializar Groq: {e}")
        # Si falla Groq, intentamos seguir para ver si Gemini funciona

if not AI_PROVIDER and gemini_key:
    try:
        import google.generativeai as genai
        genai.configure(api_key=gemini_key)  # type: ignore
        AI_PROVIDER = "gemini"
        print("✅ Usando Google Gemini AI")
    except Exception as e:
        print(f"⚠️ Error configurando Gemini: {e}")

if not AI_PROVIDER:
    print("❌ No hay ninguna API de IA configurada. Configura GROQ_API_KEY o GEMINI_API_KEY")

from ..schemas import PromptUsuario
from ..database import get_session
from ..security import get_current_user_id
from ..models import Event, FamilyMember, EventShare

router = APIRouter()

def call_groq_ai(prompt: str) -> str:
    """Llama a Groq AI (gratis y muy rápido)"""
    if not groq_client:
        raise RuntimeError("Groq client no está disponible")
        
    chat_completion = groq_client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "Eres un asistente de calendario experto. Devuelve SOLO JSON válido, sin markdown ni explicaciones."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        model="llama-3.3-70b-versatile",  # Modelo actualizado (reemplaza llama-3.1-70b-versatile descontinuado)
        temperature=0.3,
        max_tokens=1024,
    )
    return chat_completion.choices[0].message.content

def call_gemini_ai(prompt: str) -> str:
    """Llama a Google Gemini AI"""
    import google.generativeai as genai
    model = genai.GenerativeModel('gemini-1.5-flash')  # type: ignore
    response = model.generate_content(prompt)
    return response.text


# ---------------------------------------------------------------------------
# Streaming helpers
# ---------------------------------------------------------------------------

async def _stream_groq_tokens(prompt: str) -> AsyncGenerator[str, None]:
    """
    Generador asíncrono que produce tokens SSE desde Groq con stream=True.

    Protocolo SSE:
    - `data: {"type":"token","value":"..."}\\n\\n`  → fragmento de texto
    - `data: {"type":"done","result":{...}}\\n\\n`   → JSON final parseado
    - `data: {"type":"error","message":"..."}\\n\\n` → error
    """
    if not groq_client:
        yield 'data: {"type":"error","message":"Groq no disponible"}\n\n'
        return

    buffer = ""
    try:
        stream = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "Eres un asistente de calendario experto. Devuelve SOLO JSON válido, sin markdown ni explicaciones.",
                },
                {"role": "user", "content": prompt},
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=512,
            stream=True,          # ← clave del streaming
        )

        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                buffer += delta
                # Enviar cada fragmento al cliente inmediatamente
                payload = json.dumps({"type": "token", "value": delta}, ensure_ascii=False)
                yield f"data: {payload}\n\n"

        # Parsear el JSON completo acumulado
        clean = buffer.replace("```json", "").replace("```", "").strip()
        result = json.loads(clean)
        done_payload = json.dumps({"type": "done", "result": result}, ensure_ascii=False)
        yield f"data: {done_payload}\n\n"

    except json.JSONDecodeError as exc:
        err = json.dumps({"type": "error", "message": f"JSON inválido: {str(exc)}"})
        yield f"data: {err}\n\n"
    except Exception as exc:
        err = json.dumps({"type": "error", "message": f"Error IA: {str(exc)}"})
        yield f"data: {err}\n\n"


async def _stream_gemini_tokens(prompt: str) -> AsyncGenerator[str, None]:
    """
    Generador asíncrono que produce tokens SSE desde Gemini con stream=True.
    """
    try:
        import google.generativeai as genai
        model = genai.GenerativeModel("gemini-1.5-flash")   # type: ignore
        buffer = ""
        for chunk in model.generate_content(prompt, stream=True):  # type: ignore
            text = chunk.text if hasattr(chunk, "text") else ""
            if text:
                buffer += text
                payload = json.dumps({"type": "token", "value": text}, ensure_ascii=False)
                yield f"data: {payload}\n\n"

        clean = buffer.replace("```json", "").replace("```", "").strip()
        result = json.loads(clean)
        done_payload = json.dumps({"type": "done", "result": result}, ensure_ascii=False)
        yield f"data: {done_payload}\n\n"

    except json.JSONDecodeError as exc:
        err = json.dumps({"type": "error", "message": f"JSON inválido: {str(exc)}"})
        yield f"data: {err}\n\n"
    except Exception as exc:
        err = json.dumps({"type": "error", "message": f"Error IA: {str(exc)}"})
        yield f"data: {err}\n\n"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/interpretar-stream",
    summary="Interpreta texto y transmite la respuesta en tiempo real (SSE)",
    description=(
        "Versión streaming del endpoint de interpretación de IA. "
        "Emite **Server-Sent Events** (SSE) conforme la IA genera tokens, "
        "permitiendo que la UI muestre la respuesta progresivamente sin esperar "
        "a que el modelo termine.\n\n"
        "**Formato del stream:**\n"
        "```\n"
        "data: {\"type\":\"token\",  \"value\":\"fragmento de texto\"}\n"
        "data: {\"type\":\"done\",   \"result\":{...JSON final...}}\n"
        "data: {\"type\":\"error\",  \"message\":\"descripción del error\"}\n"
        "```\n\n"
        "El evento `done` contiene el JSON completo del evento interpretado "
        "listo para confirmar y guardar en el calendario."
    ),
    response_class=StreamingResponse,
)
async def interpretar_stream(prompt: PromptUsuario):
    if not AI_PROVIDER:
        raise HTTPException(
            status_code=503,
            detail="No hay ninguna API de IA configurada. Configura GROQ_API_KEY o GEMINI_API_KEY.",
        )

    ahora = datetime.now().isoformat()
    system_prompt = (
        f"Actúa como un asistente de calendario experto. La fecha y hora actual es: {ahora}.\n"
        f'Tu tarea es convertir el texto del usuario en un objeto JSON con los campos '
        f'"title", "start_time", "end_time", "category", "description".\n'
        f'Texto del usuario: "{prompt.texto}"\n'
        f"IMPORTANTE: Devuelve SOLO el JSON, sin ```json ni markdown."
    )

    generator = (
        _stream_groq_tokens(system_prompt)
        if AI_PROVIDER == "groq"
        else _stream_gemini_tokens(system_prompt)
    )

    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # Desactiva buffering en Nginx/Render
            "Connection": "keep-alive",
        },
    )


@router.post("/interpretar", summary="Interpreta texto de usuario para crear un evento")
async def procesar_texto_ia(prompt: PromptUsuario):
    print(f"🤖 Recibida solicitud de IA: {prompt.texto[:50]}...")
    
    if not AI_PROVIDER:
        raise HTTPException(
            status_code=503, 
            detail="No hay ninguna API de IA configurada. Configura GROQ_API_KEY (gratis) o GEMINI_API_KEY en las variables de entorno."
        )
    
    print(f"✅ Usando proveedor: {AI_PROVIDER.upper()}")

    try:
        ahora = datetime.now().isoformat()
        system_prompt = f"""
        Actúa como un asistente de calendario experto. La fecha y hora actual es: {ahora}.
        Tu tarea es convertir el texto del usuario en un objeto JSON estricto con los campos "title", "start_time", "end_time", "category", "description".
        Texto del usuario: "{prompt.texto}"
        IMPORTANTE: Devuelve SOLO el JSON, sin ```json ni markdown.
        """
        
        print(f"📡 Enviando request a {AI_PROVIDER.upper()}...")
        
        if AI_PROVIDER == "groq":
            response_text = call_groq_ai(system_prompt)
        else:  # gemini
            response_text = call_gemini_ai(system_prompt)
            
        print(f"✅ Respuesta recibida: {response_text[:100]}...")
        
        # Limpiar respuesta
        texto_limpio = response_text.replace("```json", "").replace("```", "").strip()
        resultado = json.loads(texto_limpio)
        print(f"✅ JSON parseado correctamente")
        return resultado
        
    except json.JSONDecodeError as e:
        print(f"❌ Error parseando JSON: {str(e)}")
        # print(f"   Texto recibido: {texto_limpio}") # texto_limpio might not be defined if error happens before
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
    """Analiza eventos existentes y sugiere el mejor horario"""
    if not AI_PROVIDER:
        raise HTTPException(status_code=503, detail="No hay ninguna API de IA configurada")
    
    # Obtener eventos de los próximos 7 días
    now = datetime.now()
    week_later = now + timedelta(days=7)
    
    statement = select(Event).where(
        Event.family_id == user_id,
        Event.start_time >= now,
        Event.start_time <= week_later
    )
    eventos = session.exec(statement).all()
    
    # Crear contexto de eventos
    eventos_str = "\n".join([
        f"- {e.title}: {e.start_time.isoformat()} a {e.end_time.isoformat()}"
        for e in eventos
    ])
    
    system_prompt = f"""
    Eres un asistente de calendario. Analiza los siguientes eventos programados:
    {eventos_str}
    
    El usuario quiere: "{prompt.texto}"
    
    Sugiere el mejor horario considerando:
    1. Evitar conflictos
    2. Horarios razonables (9am-9pm)
    3. Dejar tiempo entre eventos
    
    Devuelve SOLO un JSON con: {{"suggested_start": "ISO8601", "suggested_end": "ISO8601", "reason": "explicación breve"}}
    """
    
    try:
        if AI_PROVIDER == "groq":
            response_text = call_groq_ai(system_prompt)
        else:
            response_text = call_gemini_ai(system_prompt)
            
        texto_limpio = response_text.replace("```json", "").replace("```", "").strip()
        return json.loads(texto_limpio)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/analyze-routine", summary="Analiza rutinas y patrones de eventos")
async def analyze_routine(
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """Analiza patrones en los eventos del usuario"""
    if not AI_PROVIDER:
        raise HTTPException(status_code=503, detail="No hay ninguna API de IA configurada")
    
    # Obtener eventos del último mes
    month_ago = datetime.now() - timedelta(days=30)
    statement = select(Event).where(
        Event.family_id == user_id,
        Event.start_time >= month_ago
    )
    eventos = session.exec(statement).all()
    
    if not eventos:
        return {"analysis": "No hay suficientes eventos para analizar patrones."}
    
    # Crear resumen de eventos
    eventos_resumen = {}
    for e in eventos:
        categoria = e.category or "sin_categoria"
        if categoria not in eventos_resumen:
            eventos_resumen[categoria] = 0
        eventos_resumen[categoria] += 1
    
    system_prompt = f"""
    Analiza los siguientes datos de eventos del último mes:
    {json.dumps(eventos_resumen, indent=2)}
    
    Total de eventos: {len(eventos)}
    
    Proporciona:
    1. Patrones identificados
    2. Sugerencias para optimizar el tiempo
    3. Categorías más frecuentes
    
    Devuelve un JSON con: {{"patterns": [], "suggestions": [], "top_categories": []}}
    """
    
    try:
        if AI_PROVIDER == "groq":
            response_text = call_groq_ai(system_prompt)
        else:
            response_text = call_gemini_ai(system_prompt)
            
        texto_limpio = response_text.replace("```json", "").replace("```", "").strip()
        return json.loads(texto_limpio)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al analizar rutinas: {str(e)}")


@router.post("/sugerir-eventos", summary="Sugiere eventos basados en texto natural")
async def suggest_events_from_text(
    prompt: PromptUsuario,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Usa IA para sugerir múltiples eventos basados en texto natural del usuario.
    Ejemplo: "Necesito organizar una reunión de equipo la próxima semana"
    """
    if not AI_PROVIDER:
        raise HTTPException(
            status_code=503,
            detail="No hay ninguna API de IA configurada. Configura GROQ_API_KEY o GEMINI_API_KEY."
        )
    
    try:
        ahora = datetime.now().isoformat()
        system_prompt = f"""
        Actúa como un asistente de calendario experto. La fecha y hora actual es: {ahora}.
        El usuario dice: "{prompt.texto}"
        
        Tu tarea es sugerir eventos apropiados en formato JSON array.
        Cada evento debe tener: title, start_time, end_time, category, description.
        
        Categorías válidas: work, personal, family, health, education, other.
        
        IMPORTANTE: Devuelve SOLO un array JSON, sin markdown ni explicaciones.
        Ejemplo: [{{"title": "...", "start_time": "2025-12-01T10:00:00", ...}}]
        """
        
        if AI_PROVIDER == "groq":
            response_text = call_groq_ai(system_prompt)
        else:
            response_text = call_gemini_ai(system_prompt)
        
        # Limpiar respuesta
        texto_limpio = response_text.replace("```json", "").replace("```", "").strip()
        eventos = json.loads(texto_limpio)
        
        # Asegurar que es un array
        if not isinstance(eventos, list):
            eventos = [eventos]
        
        return {
            "eventos": eventos,
            "count": len(eventos),
            "provider": AI_PROVIDER
        }
        
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"La IA no devolvió un JSON válido: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar con IA: {str(e)}"
        )


@router.post("/propose-edit", summary="Propone cambios a un evento específico usando IA")
async def propose_edit(
    prompt: PromptUsuario,
    event_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Analiza un evento específico y propone cambios basados en lenguaje natural.
    Ejemplo: "Pásalo a las 5pm" o "Ponle que es importante en la descripción"
    """
    if not AI_PROVIDER:
        raise HTTPException(status_code=503, detail="No hay ninguna API de IA configurada")
    
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
        
    ahora = datetime.now().isoformat()
    system_prompt = f"""
    Eres un asistente de calendario experto. La fecha actual es {ahora}.
    
    ESTÁS EDITANDO EL SIGUIENTE EVENTO:
    - Título: {event.title}
    - Inicio: {event.start_time.isoformat()}
    - Fin: {event.end_time.isoformat()}
    - Categoría: {event.category}
    - Descripción: {event.description or "Sin descripción"}
    
    EL USUARIO QUIERE: "{prompt.texto}"
    
    Tu tarea es devolver un objeto JSON con los campos actualizados ("title", "start_time", "end_time", "category", "description").
    Mantén los campos originales si el usuario no los menciona o no pide cambiarlos explícitamente.
    
    IMPORTANTE: Devuelve SOLO el JSON, sin markdown.
    """
    
    try:
        if AI_PROVIDER == "groq":
            response_text = call_groq_ai(system_prompt)
        else:
            response_text = call_gemini_ai(system_prompt)
            
        texto_limpio = response_text.replace("```json", "").replace("```", "").strip()
        resultado = json.loads(texto_limpio)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error IA: {str(e)}")


@router.get("/proactive-insights", summary="Obtiene insights proactivos de Aura")
async def get_proactive_insights(
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """Analiza la semana y devuelve sugerencias proactivas de 'Aura'."""
    if not AI_PROVIDER:
        raise HTTPException(status_code=503, detail="No hay ninguna API de IA configurada")
    
    # Obtener eventos de los próximos 7 días
    now = datetime.now()
    week_later = now + timedelta(days=7)
    
    # Buscar family_id
    member = session.exec(select(FamilyMember).where(FamilyMember.user_id == user_id)).first()
    if not member:
        return {"insights": []}
        
    statement = select(Event).where(
        Event.family_id == member.family_id,
        Event.start_time >= now,
        Event.start_time <= week_later
    )
    eventos = session.exec(statement).all()
    
    if not eventos:
        return {"insights": [{"content": "Tu calendario está libre esta semana. ¡Buen momento para planear algo en familia!", "type": "info"}]}
        
    # Crear contexto
    eventos_data = [
        {"title": e.title, "start": e.start_time.isoformat(), "category": e.category}
        for e in eventos
    ]
    
    system_prompt = f"""
    Actúa como 'Aura', una compañera IA familiar. Tu tono es cálido, proactivo y servicial.
    Analiza estos eventos de la familia: {json.dumps(eventos_data)}
    
    Genera 1-2 insights proactivos en formato JSON:
    {{
        "insights": [
            {{
                "id": "unique-id",
                "title": "💡 Tip de Aura",
                "content": "Veo que tienes 3 cosas el martes...",
                "action": "mover|eliminar|nada",
                "event_id": 123 (si aplica),
                "suggestion": "2024-12-01T10:00:00" (si aplica)
            }}
        ]
    }}
    IMPORTANTE: Devuelve SOLO JSON, sin markdown.
    """
    
    try:
        if AI_PROVIDER == "groq":
            response_text = call_groq_ai(system_prompt)
        else:
            response_text = call_gemini_ai(system_prompt)
            
        texto_limpio = response_text.replace("```json", "").replace("```", "").strip()
        return json.loads(texto_limpio)
    except Exception:
        return {"insights": []}


@router.post("/optimizar-calendario", summary="Optimiza el calendario usando IA")
async def optimize_schedule(
    prompt: PromptUsuario,
    session: Session = Depends(get_session),
    user_id: int = Depends(get_current_user_id)
):
    """
    Usa IA para analizar el calendario actual y sugerir optimizaciones.
    Ejemplo: "Optimiza mi calendario de esta semana para tener más tiempo libre"
    """
    if not AI_PROVIDER:
        raise HTTPException(
            status_code=503,
            detail="No hay ninguna API de IA configurada. Configura GROQ_API_KEY o GEMINI_API_KEY."
        )
    
    try:
        # Obtener eventos del usuario de la próxima semana
        ahora = datetime.now()
        una_semana = ahora + timedelta(days=7)
        
        # Obtener family_id del usuario
        member = session.exec(
            select(FamilyMember).where(FamilyMember.user_id == user_id)
        ).first()
        
        if not member:
            raise HTTPException(
                status_code=404,
                detail="Usuario no pertenece a ninguna familia"
            )
        
        # Obtener eventos
        events_query = select(Event).where(
            or_(
                Event.owner_id == user_id,
                Event.family_id == member.family_id
            ),
            Event.start_time >= ahora,
            Event.start_time <= una_semana
        )
        eventos = session.exec(events_query).all()
        
        # Convertir eventos a formato simple para la IA
        eventos_data = [
            {
                "id": e.id,
                "title": e.title,
                "start_time": e.start_time.isoformat(),
                "end_time": e.end_time.isoformat(),
                "category": e.category
            }
            for e in eventos
        ]
        
        system_prompt = f"""
        Actúa como un experto en productividad y gestión del tiempo.
        Fecha actual: {ahora.isoformat()}
        
        El usuario tiene estos eventos programados:
        {json.dumps(eventos_data, indent=2)}
        
        El usuario solicita: "{prompt.texto}"
        
        Analiza el calendario y sugiere optimizaciones en formato JSON:
        {{
            "analisis": "breve análisis del calendario actual",
            "sugerencias": [
                {{
                    "event_id": 123,
                    "accion": "mover|eliminar|combinar",
                    "razon": "explicación",
                    "nuevo_horario": "2025-12-01T14:00:00" (si aplica)
                }}
            ],
            "tiempo_libre_ganado": "X horas"
        }}
        
        IMPORTANTE: Devuelve SOLO JSON, sin markdown.
        """
        
        if AI_PROVIDER == "groq":
            response_text = call_groq_ai(system_prompt)
        else:
            response_text = call_gemini_ai(system_prompt)
        
        # Limpiar respuesta
        texto_limpio = response_text.replace("```json", "").replace("```", "").strip()
        optimizacion = json.loads(texto_limpio)
        
        return {
            "optimizacion": optimizacion,
            "eventos_analizados": len(eventos),
            "provider": AI_PROVIDER
        }
        
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"La IA no devolvió un JSON válido: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al optimizar calendario: {str(e)}"
        )
