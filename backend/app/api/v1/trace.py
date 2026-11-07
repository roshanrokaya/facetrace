from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.deps import get_current_user, get_db
from app.models.event import RecognitionEvent
from app.models.person import Person
from app.models.camera import Camera
from typing import Optional

router = APIRouter()


@router.get("/{person_id}")
def get_person_trace(
    person_id: int,
    days: int = 7,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a timeline of where and when a person was seen."""
    person = db.query(Person).filter(Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    from datetime import datetime, timedelta
    from sqlalchemy import and_, func

    cutoff = datetime.utcnow() - timedelta(days=days)

    events = (
        db.query(RecognitionEvent)
        .options(joinedload(RecognitionEvent.camera))
        .filter(
            and_(
                RecognitionEvent.person_id == person_id,
                RecognitionEvent.first_seen >= cutoff,
            )
        )
        .order_by(RecognitionEvent.first_seen.desc())
        .all()
    )

    timeline = []
    for event in events:
        camera = event.camera
        timeline.append({
            "event_id": event.id,
            "camera_id": event.camera_id,
            "camera_name": camera.name if camera else f"Camera #{event.camera_id}",
            "camera_location": camera.location if camera else "Unknown",
            "first_seen": event.first_seen.isoformat() if event.first_seen else None,
            "last_seen": event.last_seen.isoformat() if event.last_seen else None,
            "similarity": event.similarity,
        })

    return {
        "person": {
            "id": person.id,
            "code": person.code,
            "full_name": person.full_name,
        },
        "days": days,
        "total_events": len(timeline),
        "timeline": timeline,
    }
