# Recognition event repository for database operations
from sqlalchemy.orm import Session
from app.models.event import RecognitionEvent
from typing import Optional, List
from datetime import datetime


def get_events(
    db: Session, skip: int = 0, limit: int = 100
) -> List[RecognitionEvent]:
    return (
        db.query(RecognitionEvent)
        .order_by(RecognitionEvent.first_seen.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_event(db: Session, event_id: int) -> Optional[RecognitionEvent]:
    return db.query(RecognitionEvent).filter(RecognitionEvent.id == event_id).first()


def create_event(
    db: Session,
    camera_id: int,
    person_id: Optional[int],
    similarity: float,
    is_unknown: bool = False,
    snapshot_path: Optional[str] = None,
    embedding: Optional[list] = None,
) -> RecognitionEvent:
    event = RecognitionEvent(
        camera_id=camera_id,
        person_id=person_id,
        similarity=similarity,
        is_unknown=is_unknown,
        snapshot_path=snapshot_path,
        embedding=embedding,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def label_event(
    db: Session, event_id: int, person_id: int
) -> Optional[RecognitionEvent]:
    """Label an unknown event as a specific person."""
    event = db.query(RecognitionEvent).filter(RecognitionEvent.id == event_id).first()
    if not event:
        return None
    event.person_id = person_id
    event.is_unknown = False
    db.commit()
    db.refresh(event)
    return event
