"""Tests for WebSocket endpoints."""

import pytest
from fastapi.testclient import TestClient


class TestWebSocketStream:
    def test_camera_stream_connects(self, client):
        with client.websocket_connect("/api/v1/ws/stream/1") as ws:
            ws.send_text("ping")
            data = ws.receive_json()
            assert data["type"] == "pong"

    def test_events_stream_connects(self, client):
        with client.websocket_connect("/api/v1/ws/events") as ws:
            ws.send_text("ping")
            data = ws.receive_json()
            assert data["type"] == "pong"
