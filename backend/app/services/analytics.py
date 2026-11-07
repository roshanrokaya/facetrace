# Footfall, heatmap, attendance, and z-score calculations
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models.event import RecognitionEvent
from app.models.person import Person
from typing import Dict, List
import math


def get_attendance_for_person(
    db: Session,
    person_id: int,
    days: int = 30,
) -> Dict:
    """Calculate attendance percentage for a person over the last N days."""
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

    return {
        "person_id": person_id,
        "days_present": days_present,
        "total_days": days,
        "attendance_pct": round((days_present / days) * 100, 2) if days > 0 else 0,
    }


def get_all_attendance(db: Session, days: int = 30) -> List[Dict]:
    """Get attendance for all active persons."""
    persons = db.query(Person).filter(Person.is_active == True).all()
    results = []
    for person in persons:
        att = get_attendance_for_person(db, person.id, days)
        att["full_name"] = person.full_name
        att["code"] = person.code
        results.append(att)
    results.sort(key=lambda x: x["attendance_pct"])
    return results


def calculate_z_scores(db: Session, days: int = 30) -> List[Dict]:
    """
    Calculate z-scores for daily footfall to detect anomalous days.
    A z-score > 2 or < -2 indicates an unusual day.
    """
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days)

    daily_counts = []
    current = start_date
    while current <= end_date:
        count = db.query(RecognitionEvent).filter(
            func.date(RecognitionEvent.first_seen) == current
        ).count()
        daily_counts.append({"date": current.isoformat(), "count": count})
        current += timedelta(days=1)

    counts = [d["count"] for d in daily_counts]
    if len(counts) < 2:
        return daily_counts

    mean = sum(counts) / len(counts)
    std = math.sqrt(sum((c - mean) ** 2 for c in counts) / len(counts))

    for d in daily_counts:
        d["z_score"] = round((d["count"] - mean) / std, 2) if std > 0 else 0.0
        d["is_anomaly"] = abs(d["z_score"]) > 2

    return daily_counts
