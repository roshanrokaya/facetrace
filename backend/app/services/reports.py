# CSV and PDF report generation
import csv
import io
from datetime import datetime, timedelta
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from app.models.event import RecognitionEvent
from app.models.person import Person
from typing import Optional


def generate_events_csv(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> str:
    """Generate a CSV string of recognition events."""
    query = db.query(RecognitionEvent).options(joinedload(RecognitionEvent.person)).order_by(RecognitionEvent.first_seen.desc())

    if start_date:
        query = query.filter(RecognitionEvent.first_seen >= start_date)
    if end_date:
        query = query.filter(RecognitionEvent.first_seen <= end_date)

    events = query.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "camera_id", "person_id", "person_name",
        "similarity", "is_unknown", "first_seen", "last_seen",
    ])

    for event in events:
        person_name = event.person.full_name if event.person else "Unknown"
        writer.writerow([
            event.id,
            event.camera_id,
            event.person_id,
            person_name,
            event.similarity,
            event.is_unknown,
            event.first_seen.isoformat() if event.first_seen else "",
            event.last_seen.isoformat() if event.last_seen else "",
        ])

    return output.getvalue()


def generate_attendance_csv(db: Session, days: int = 30) -> str:
    """Generate a CSV of attendance data for all persons."""
    from app.services.analytics import get_all_attendance
    attendance = get_all_attendance(db, days)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["code", "full_name", "days_present", "total_days", "attendance_pct"])

    for record in attendance:
        writer.writerow([
            record["code"],
            record["full_name"],
            record["days_present"],
            record["total_days"],
            record["attendance_pct"],
        ])

    return output.getvalue()


def generate_daily_summary_csv(db: Session, days: int = 30) -> str:
    """Generate a CSV with daily entry counts."""
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["date", "total_entries", "unique_persons", "unknown_count"])

    current = start_date
    while current <= end_date:
        total = db.query(RecognitionEvent).filter(
            func.date(RecognitionEvent.first_seen) == current
        ).count()

        unique = db.query(RecognitionEvent.person_id).filter(
            and_(
                func.date(RecognitionEvent.first_seen) == current,
                RecognitionEvent.person_id.isnot(None),
            )
        ).distinct().count()

        unknown = db.query(RecognitionEvent).filter(
            and_(
                func.date(RecognitionEvent.first_seen) == current,
                RecognitionEvent.is_unknown == True,
            )
        ).count()

        writer.writerow([current.isoformat(), total, unique, unknown])
        current += timedelta(days=1)

    return output.getvalue()
