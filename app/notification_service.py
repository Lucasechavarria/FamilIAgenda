import os
import json
import firebase_admin
from firebase_admin import credentials, messaging
from sqlmodel import Session, select
from .models import NotificationToken

# Variable para asegurar que Firebase se inicialice solo una vez
_firebase_app_initialized = False

def initialize_firebase_app():
    """
    Inicializa la app de Firebase Admin usando las credenciales
    guardadas en una variable de entorno.
    """
    global _firebase_app_initialized
    if _firebase_app_initialized:
        return

    # Las credenciales se esperan como un string JSON en la variable de entorno
    firebase_creds_json = os.getenv("FIREBASE_ADMIN_CREDENTIALS")
    if not firebase_creds_json:
        print("Advertencia: FIREBASE_ADMIN_CREDENTIALS no está configurada. Las notificaciones no funcionarán.")
        return

    try:
        creds_dict = json.loads(firebase_creds_json)
        cred = credentials.Certificate(creds_dict)
        firebase_admin.initialize_app(cred)
        _firebase_app_initialized = True
        print("Firebase Admin SDK inicializado correctamente.")
    except Exception as e:
        print(f"Error al inicializar Firebase Admin SDK: {e}")

def send_notification_to_family(session: Session, family_id: int, title: str, body: str):
    """
    Busca todos los tokens de los dispositivos de una familia y les envía una notificación.
    """
    if not _firebase_app_initialized:
        print("No se puede enviar notificación: Firebase no está inicializado.")
        return 

    # 1. Obtener todos los tokens para la familia
    statement = select(NotificationToken).where(NotificationToken.family_id == family_id)
    tokens_in_db = session.exec(statement).all()
    
    registration_tokens = [t.token for t in tokens_in_db]

    if not registration_tokens:
        return # No hay dispositivos registrados

    # 2. Crear el mensaje
    message = messaging.MulticastMessage(
        notification=messaging.Notification(title=title, body=body),
        tokens=registration_tokens,
    )

    # 3. Enviar el mensaje
    response = messaging.send_multicast(message)  # type: ignore
    print(f"Notificaciones enviadas: {response.success_count}, fallidas: {response.failure_count}")