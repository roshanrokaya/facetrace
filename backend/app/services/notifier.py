"""Unified notification dispatcher — sends alerts via all channels."""
import asyncio
import logging
from app.services.email_service import send_alert_email

logger = logging.getLogger(__name__)

_ws_manager = None


def _get_ws_manager():
    global _ws_manager
    if _ws_manager is None:
        from app.api.v1.ws import manager
        _ws_manager = manager
    return _ws_manager


def dispatch_alert(
    alert_id: int,
    alert_type: str,
    message: str,
    snapshot_url: str | None = None,
    created_at: str | None = None,
    camera_name: str | None = None,
):
    """
    Send an alert through all notification channels:
    1. WebSocket (real-time push to connected clients)
    2. Email (SMTP to configured recipients)
    3. Browser push + sound (triggered by the WebSocket message on the frontend)
    """

    # 1. WebSocket broadcast
    ws_data = {
        "type": "alert",
        "alert": {
            "id": alert_id,
            "type": alert_type,
            "message": message,
            "status": "open",
            "snapshot_url": snapshot_url,
            "created_at": created_at,
            "camera_name": camera_name,
        },
    }

    mgr = _get_ws_manager()
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(mgr.broadcast_event(ws_data))
        else:
            loop.run_until_complete(mgr.broadcast_event(ws_data))
    except RuntimeError:
        loop = asyncio.new_event_loop()
        loop.run_until_complete(mgr.broadcast_event(ws_data))
        loop.close()

    logger.info(f"WebSocket alert broadcast: {alert_type} (id={alert_id})")

    # 2. Email notification (runs in background thread)
    send_alert_email(
        alert_type=alert_type,
        message=message,
        snapshot_path=snapshot_url,
        camera_name=camera_name,
        timestamp=created_at,
    )
