from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, require_role, get_db
from app.services.alerts import (
    get_alerts as svc_get_alerts,
    acknowledge_alert as svc_acknowledge_alert,
)
from typing import Optional

router = APIRouter()


@router.get("/")
def get_alerts(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    alerts = svc_get_alerts(db, status=status, skip=skip, limit=limit)
    alerts_list = []
    for a in alerts:
        snapshot_url = None
        if a.event and a.event.snapshot_path:
            snapshot_url = f"/api/v1/snapshots/{a.event.snapshot_path}"
        alerts_list.append({
            "id": a.id,
            "type": a.type,
            "event_id": a.event_id,
            "person_id": a.person_id,
            "message": a.message,
            "status": a.status,
            "snapshot_url": snapshot_url,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        })
    return {"alerts": alerts_list}


@router.patch("/{alert_id}")
def acknowledge_alert(
    alert_id: int,
    current_user=Depends(require_role(["operator", "admin"])),
    db: Session = Depends(get_db),
):
    alert = svc_acknowledge_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert acknowledged", "data": {"id": alert.id, "status": alert.status}}
