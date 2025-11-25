from typing import List, Dict
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Mapa de family_id -> List[WebSocket]
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, family_id: int):
        await websocket.accept()
        if family_id not in self.active_connections:
            self.active_connections[family_id] = []
        self.active_connections[family_id].append(websocket)

    def disconnect(self, websocket: WebSocket, family_id: int):
        if family_id in self.active_connections:
            if websocket in self.active_connections[family_id]:
                self.active_connections[family_id].remove(websocket)

    async def broadcast(self, message: dict, family_id: int):
        if family_id in self.active_connections:
            for connection in self.active_connections[family_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error sending message: {e}")

manager = ConnectionManager()
