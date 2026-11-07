# Cooldown window deduplication
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.event import RecognitionEvent


def is_duplicate_event(
    db: Session,
    person_id: int,
    camera_id: int,
    cooldown_seconds: int = 60,
) -> bool:
    """
    Check if a recognition event is a duplicate within the cooldown window.
    Returns True if a recent event exists for the same person at the same camera.
    """
    if person_id is None:
        return False
    cutoff = datetime.utcnow() - timedelta(seconds=cooldown_seconds)

    recent = db.query(RecognitionEvent).filter(
        and_(
            RecognitionEvent.person_id == person_id,
            RecognitionEvent.camera_id == camera_id,
            RecognitionEvent.first_seen >= cutoff,
        )
    ).first()

    return recent is not None


def is_duplicate_unknown(
    db: Session,
    camera_id: int,
    cooldown_seconds: int = 30,
) -> bool:
    """
    Check if an unknown face event was recently logged for this camera.
    Prevents flooding the events table with repeated unknown detections.
    """
    cutoff = datetime.utcnow() - timedelta(seconds=cooldown_seconds)

    recent = db.query(RecognitionEvent).filter(
        and_(
            RecognitionEvent.person_id.is_(None),
            RecognitionEvent.is_unknown == True,
            RecognitionEvent.camera_id == camera_id,
            RecognitionEvent.first_seen >= cutoff,
        )
    ).first()

    return recent is not None


def deduplicate_or_update(
    db: Session,
    person_id: int,
    camera_id: int,
    similarity: float,
    cooldown_seconds: int = 300,
) -> RecognitionEvent:
    """
    If a recent event exists for the same person+camera within the cooldown
    window, update its last_seen timestamp. Otherwise create a new event.
    Returns the event (existing updated or newly created).
    """
    cutoff = datetime.utcnow() - timedelta(seconds=cooldown_seconds)

    existing = db.query(RecognitionEvent).filter(
        and_(
            RecognitionEvent.person_id == person_id,
            RecognitionEvent.camera_id == camera_id,
            RecognitionEvent.first_seen >= cutoff,
        )
    ).order_by(RecognitionEvent.first_seen.desc()).first()

    if existing:
        existing.last_seen = datetime.utcnow()
        if similarity > (existing.similarity or 0):
            existing.similarity = similarity
        db.commit()
        return existing

    event = RecognitionEvent(
        camera_id=camera_id,
        person_id=person_id,
        similarity=similarity,
        is_unknown=False,
    )
    db.add(event)
    db.commit()
    return event
