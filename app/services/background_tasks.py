import asyncio
import json
from datetime import datetime, timedelta
from sqlmodel import Session, select
from ..database import engine
from ..models import Task
from .websocket_manager import manager

async def check_upcoming_tasks():
    """
    Revisa tareas pendientes y envía notificaciones si están próximas a vencer.
    Se ejecuta en un bucle infinito.
    """
    print("Iniciando servicio de notificaciones en segundo plano...")
    while True:
        try:
            with Session(engine) as session:
                now = datetime.utcnow()
                # Buscar tareas pendientes que venzan en la próxima hora
                # (Simplificación: en prod buscaríamos rangos específicos para no repetir alertas)
                
                # Para evitar spam, podríamos tener un campo 'last_notification_sent_at' en Task
                # Por ahora, simularemos enviando alertas para tareas que vencen entre 14 y 16 min (para la alerta de 15)
                # y entre 29 y 31 min (para la alerta de 30)
                
                tasks = session.exec(select(Task).where(Task.status == "pending")).all()
                
                for task in tasks:
                    if not task.notification_config:
                        continue
                        
                    config = json.loads(task.notification_config)
                    pre_alerts = config.get("pre", [])
                    
                    time_diff = task.due_date - now
                    minutes_left = time_diff.total_seconds() / 60
                    
                    should_notify = False
                    alert_type = ""
                    
                    # Lógica simple de "ventana de notificación" para demo
                    # En un sistema real, marcaríamos la notificación como enviada en DB
                    for minutes in pre_alerts:
                        # Si faltan aprox 'minutes' minutos (con ventana de 1 min)
                        if minutes - 1 <= minutes_left <= minutes + 1:
                            should_notify = True
                            alert_type = f"Faltan {minutes} min"
                            break
                            
                    if should_notify:
                        # Enviar WebSocket
                        await manager.broadcast({
                            "type": "notification",
                            "title": "Recordatorio de Tarea",
                            "message": f"{task.title}: {alert_type}",
                            "task_id": task.id,
                            "severity": "warning"
                        }, task.family_id)
                        
                        # Aquí marcaríamos en DB que ya se notificó para no repetir
                        # task.last_notification = now ... session.commit()
                        
        except Exception as e:
            print(f"Error en background task: {e}")
            
        # Esperar 60 segundos antes de la próxima revisión
        await asyncio.sleep(60)
