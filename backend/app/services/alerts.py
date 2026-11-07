# Alert generation logic
from datetime import datetime, timedelta
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func
from app.models.alert import Alert
from app.models.event import RecognitionEvent
from app.models.camera import Camera
from app.models.person import Person
from typing import List, Optional


def create_alert(
    db: Session,
    alert_type: str,
    message: str,
    event_id: Optional[int] = None,
    person_id: Optional[int] = None,
) -> Alert:
    """Create a new alert and dispatch notifications."""
    alert = Alert(
        type=alert_type,
        event_id=event_id,
        person_id=person_id,
        message=message,
        status="open",
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    # Dispatch notifications (WebSocket + Email + browser push data)
    snapshot_url = None
    camera_name = None
    if alert.event:
        if alert.event.snapshot_path:
            snapshot_url = f"/api/v1/snapshots/{alert.event.snapshot_path}"
        if alert.event.camera:
            camera_name = alert.event.camera.name

    from app.services.notifier import dispatch_alert
    dispatch_alert(
        alert_id=alert.id,
        alert_type=alert.type,
        message=alert.message,
        snapshot_url=snapshot_url,
        created_at=alert.created_at.isoformat() if alert.created_at else None,
        camera_name=camera_name,
    )

    return alert


def get_alerts(
    db: Session,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Alert]:
    """Get alerts, optionally filtered by status."""
    query = db.query(Alert).options(
        joinedload(Alert.event).joinedload(RecognitionEvent.camera)
    ).order_by(Alert.created_at.desc())
    if status:
        query = query.filter(Alert.status == status)
    return query.offset(skip).limit(limit).all()


def acknowledge_alert(db: Session, alert_id: int) -> Optional[Alert]:
    """Mark an alert as acknowledged."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return None
    alert.status = "acknowledged"
    db.commit()
    db.refresh(alert)
    return alert


def generate_unknown_face_alert(
    db: Session,
    event_id: int,
    cooldown_seconds: int = 120,
) -> Optional[Alert]:
    """Create an alert for an unknown face detection.
    Skips if there's already an open unknown alert within the cooldown period."""
    # Dedup: check for recent open unknown alert
    cutoff = datetime.utcnow() - timedelta(seconds=cooldown_seconds)
    recent = db.query(Alert).filter(
        and_(
            Alert.type == "unknown",
            Alert.status == "open",
            Alert.created_at >= cutoff,
        )
    ).first()
    if recent:
        return None

    return create_alert(
        db,
        alert_type="unknown",
        message="Unknown face detected",
        event_id=event_id,
    )


def check_low_attendance(
    db: Session,
    person_id: int,
    days: int = 30,
    threshold_pct: float = 75.0,
) -> Optional[Alert]:
    """
    Check if a person's attendance is below threshold over the last N days.
    Creates an alert if so.
    """
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days)

    days_present = db.query(
        func.count(func.distinct(func.date(RecognitionEvent.first_seen)))
    ).filter(
        and_(
            RecognitionEvent.person_id == person_id,
            func.date(RecognitionEvent.first_seen) >= start_date,
            func.date(RecognitionEvent.first_seen) <= end_date,
        )
    ).scalar() or 0

    attendance_pct = (days_present / days) * 100 if days > 0 else 0

    if attendance_pct < threshold_pct:
        person = db.query(Person).filter(Person.id == person_id).first()
        name = person.full_name if person else f"Person #{person_id}"
        return create_alert(
            db,
            alert_type="low_attendance",
            message=f"{name} attendance is {attendance_pct:.1f}% (below {threshold_pct}%)",
            person_id=person_id,
        )
    return None


def check_unusual_time(
    db: Session,
    event: RecognitionEvent,
    early_hour: int = 5,
    late_hour: int = 22,
) -> Optional[Alert]:
    """Create an alert if an event occurs outside normal hours."""
    if event.first_seen is None:
        return None
    hour = event.first_seen.hour
    if hour < early_hour or hour >= late_hour:
        return create_alert(
            db,
            alert_type="unusual_time",
            message=f"Entry detected at unusual time ({event.first_seen.strftime('%H:%M')})",
            event_id=event.id,
            person_id=event.person_id,
        )
    return None
