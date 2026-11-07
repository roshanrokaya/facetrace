from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict
import asyncio
import json

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections for live streaming."""

    def __init__(self):
        # camera_id -> list of connected websockets
        self.camera_connections: Dict[int, List[WebSocket]] = {}
        # All event listeners
        self.event_connections: List[WebSocket] = []

    async def connect_camera(self, websocket: WebSocket, camera_id: int):
        await websocket.accept()
        if camera_id not in self.camera_connections:
            self.camera_connections[camera_id] = []
        self.camera_connections[camera_id].append(websocket)

    async def connect_events(self, websocket: WebSocket):
        await websocket.accept()
        self.event_connections.append(websocket)

    def disconnect_camera(self, websocket: WebSocket, camera_id: int):
        if camera_id in self.camera_connections:
            self.camera_connections[camera_id] = [
                ws for ws in self.camera_connections[camera_id] if ws != websocket
            ]

    def disconnect_events(self, websocket: WebSocket):
        self.event_connections = [
            ws for ws in self.event_connections if ws != websocket
        ]

    async def broadcast_frame(self, camera_id: int, data: dict):
        """Send a frame to all clients watching a camera."""
        connections = self.camera_connections.get(camera_id, [])
        disconnected = []
        for ws in connections:
            try:
                await ws.send_json(data)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            self.disconnect_camera(ws, camera_id)

    async def broadcast_event(self, data: dict):
        """Send an event to all event listeners."""
        disconnected = []
        for ws in self.event_connections:
            try:
                await ws.send_json(data)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            self.disconnect_events(ws)


# Global connection manager
manager = ConnectionManager()


@router.websocket("/ws/stream/{camera_id}")
async def websocket_camera_stream(websocket: WebSocket, camera_id: int):
    """
    WebSocket for live camera stream with face recognition overlays.
    Clients connect to receive annotated frames as base64 JPEG.
    """
    await manager.connect_camera(websocket, camera_id)
    try:
        while True:
            # Keep connection alive; frames are pushed via broadcast_frame
            data = await websocket.receive_text()
            # Client can send commands (e.g., pause/resume)
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect_camera(websocket, camera_id)


@router.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    """
    WebSocket for live event/alert notifications.
    Clients connect to receive real-time recognition events and alerts.
    """
    await manager.connect_events(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect_events(websocket)
