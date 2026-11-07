from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.deps import get_current_user, get_db
from app.models.event import RecognitionEvent
from app.repositories.event import label_event
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()


class LabelRequest(BaseModel):
    person_id: int


class DeleteRequest(BaseModel):
    ids: List[int]


@router.get("/")
def get_events(
    page: int = 1,
    per_page: int = 20,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get recognition events with pagination, filtering and search."""
    query = db.query(RecognitionEvent)

    # Filter by status
    if status == "unknown":
        query = query.filter(RecognitionEvent.is_unknown == True)
    elif status == "recognized":
        query = query.filter(RecognitionEvent.is_unknown == False)

    # Search by person name
    if search:
        from app.models.person import Person
        query = query.outerjoin(Person).filter(
            Person.full_name.ilike(f"%{search}%")
        )

    total = query.count()
    total_pages = max(1, (total + per_page - 1) // per_page)
    page = max(1, min(page, total_pages))

    events = (
        query
        .options(joinedload(RecognitionEvent.person))
        .order_by(RecognitionEvent.first_seen.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    events_list = []
    for event in events:
        events_list.append({
            "id": event.id,
            "camera_id": event.camera_id,
            "person_id": event.person_id,
            "person_name": event.person.full_name if event.person else "Unknown",
            "person_code": event.person.code if event.person else None,
            "similarity": event.similarity,
            "is_unknown": event.is_unknown,
            "snapshot_url": f"/api/v1/snapshots/{event.snapshot_path}" if event.snapshot_path else None,
            "first_seen": event.first_seen.isoformat() if event.first_seen else None,
            "last_seen": event.last_seen.isoformat() if event.last_seen else None,
        })

    return {
        "events": events_list,
        "page": page,
        "per_page": per_page,
        "total": total,
        "total_pages": total_pages,
    }


@router.delete("/bulk")
def delete_events_bulk(
    body: DeleteRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete multiple events by ID."""
    count = db.query(RecognitionEvent).filter(RecognitionEvent.id.in_(body.ids)).delete(synchronize_session=False)
    db.commit()
    return {"message": f"{count} events deleted", "deleted": count}


@router.delete("/all")
def delete_all_events(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete ALL events (reset log)."""
    count = db.query(RecognitionEvent).delete()
    db.commit()
    return {"message": f"All {count} events deleted", "deleted": count}


@router.post("/{event_id}/label")
def label_unknown_event(
    event_id: int,
    body: LabelRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Label an unknown event as a specific person."""
    event = label_event(db, event_id, body.person_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return {
        "message": "Event labeled",
        "data": {
            "id": event.id,
            "person_id": event.person_id,
            "is_unknown": event.is_unknown,
        },
    }
