from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, get_db
from app.models.event import RecognitionEvent
from app.models.person import Person
from datetime import datetime, timedelta
from sqlalchemy import func, and_, extract

router = APIRouter()


@router.get("/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    """Get dashboard statistics."""
    today = datetime.now().date()
    
    # Today's entries (recognition events today)
    today_entries = db.query(RecognitionEvent).filter(
        func.date(RecognitionEvent.first_seen) == today
    ).count()
    
    # Unique people today
    unique_people = db.query(RecognitionEvent.person_id).filter(
        and_(
            func.date(RecognitionEvent.first_seen) == today,
            RecognitionEvent.person_id.isnot(None)
        )
    ).distinct().count()
    
    # Unknown faces today
    unknown_faces = db.query(RecognitionEvent).filter(
        and_(
            func.date(RecognitionEvent.first_seen) == today,
            RecognitionEvent.is_unknown == True
        )
    ).count()
    
    # Open alerts = unknown faces detected (not yet labeled)
    open_alerts = db.query(RecognitionEvent).filter(
        and_(
            RecognitionEvent.is_unknown == True,
            RecognitionEvent.person_id.is_(None)
        )
    ).count()
    
    return {
        "today_entries": today_entries,
        "unique_people": unique_people,
        "unknown_faces": unknown_faces,
        "open_alerts": open_alerts
    }


@router.get("/footfall")
def get_footfall(db: Session = Depends(get_db)):
    """Get footfall data for the chart (last 30 days)."""
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=29)
    
    footfall_data = []
    current_date = start_date
    
    while current_date <= end_date:
        count = db.query(RecognitionEvent).filter(
            func.date(RecognitionEvent.first_seen) == current_date
        ).count()
        
        footfall_data.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "count": count
        })
        
        current_date += timedelta(days=1)
    
    return {"footfall": footfall_data}


@router.get("/heatmap")
def get_heatmap(db: Session = Depends(get_db)):
    """Get weekday × hour heatmap data."""
    # Get events for the last 30 days
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    events = db.query(
        extract('dow', RecognitionEvent.first_seen).label('weekday'),
        extract('hour', RecognitionEvent.first_seen).label('hour'),
        func.count(RecognitionEvent.id).label('count')
    ).filter(
        RecognitionEvent.first_seen >= start_date
    ).group_by(
        extract('dow', RecognitionEvent.first_seen),
        extract('hour', RecognitionEvent.first_seen)
    ).all()
    
    # Initialize 7x24 grid (7 days x 24 hours)
    heatmap_data = [[0] * 24 for _ in range(7)]
    
    for event in events:
        weekday = int(event.weekday)  # 0 = Monday, 6 = Sunday
        hour = int(event.hour)
        count = int(event.count)
        if 0 <= weekday < 7 and 0 <= hour < 24:
            heatmap_data[weekday][hour] = count
    
    return {"heatmap": heatmap_data}


@router.get("/dwell-time")
def get_dwell_time(db: Session = Depends(get_db)):
    """Get dwell time analysis - how long people stay on campus."""
    # Get first and last seen times for each person today
    today = datetime.now().date()
    
    person_dwell_times = db.query(
        RecognitionEvent.person_id,
        func.min(RecognitionEvent.first_seen).label('first_seen'),
        func.max(RecognitionEvent.last_seen).label('last_seen'),
        func.count(RecognitionEvent.id).label('visit_count')
    ).filter(
        and_(
            func.date(RecognitionEvent.first_seen) == today,
            RecognitionEvent.person_id.isnot(None)
        )
    ).group_by(RecognitionEvent.person_id).all()
    
    dwell_time_list = []
    total_dwell_seconds = 0
    
    for dwell in person_dwell_times:
        if dwell.first_seen and dwell.last_seen:
            duration_seconds = int((dwell.last_seen - dwell.first_seen).total_seconds())
            total_dwell_seconds += duration_seconds
            
            # Format duration
            hours = duration_seconds // 3600
            minutes = (duration_seconds % 3600) // 60
            duration_str = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
            
            dwell_time_list.append({
                "person_id": dwell.person_id,
                "first_seen": dwell.first_seen.isoformat(),
                "last_seen": dwell.last_seen.isoformat(),
                "duration_seconds": duration_seconds,
                "duration_formatted": duration_str,
                "visit_count": dwell.visit_count
            })
    
    # Calculate average dwell time
    avg_dwell_seconds = total_dwell_seconds / len(dwell_time_list) if dwell_time_list else 0
    avg_hours = avg_dwell_seconds // 3600
    avg_minutes = (avg_dwell_seconds % 3600) // 60
    avg_duration_str = f"{avg_hours}h {avg_minutes}m" if avg_hours > 0 else f"{avg_minutes}m"
    
    # Sort by duration (longest first)
    dwell_time_list.sort(key=lambda x: x['duration_seconds'], reverse=True)
    
    return {
        "total_persons_today": len(dwell_time_list),
        "average_dwell_time": avg_duration_str,
        "average_dwell_seconds": avg_dwell_seconds,
        "total_dwell_time_seconds": total_dwell_seconds,
        "dwell_times": dwell_time_list
    }


@router.get("/cameras")
def get_camera_analytics(db: Session = Depends(get_db)):
    """Get camera analytics - load and unknown rate."""
    # Get events by camera for the last 7 days
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    
    # Get total events per camera
    total_events = db.query(
        RecognitionEvent.camera_id,
        func.count(RecognitionEvent.id).label('total')
    ).filter(
        RecognitionEvent.first_seen >= start_date
    ).group_by(RecognitionEvent.camera_id).all()
    
    # Get unknown events per camera
    unknown_events = db.query(
        RecognitionEvent.camera_id,
        func.count(RecognitionEvent.id).label('unknown')
    ).filter(
        and_(
            RecognitionEvent.first_seen >= start_date,
            RecognitionEvent.is_unknown == True
        )
    ).group_by(RecognitionEvent.camera_id).all()
    
    # Create dictionary for easy lookup
    unknown_dict = {stat.camera_id: stat.unknown for stat in unknown_events}
    
    camera_analytics = []
    for stat in total_events:
        total = stat.total or 0
        unknown = unknown_dict.get(stat.camera_id, 0)
        unknown_rate = (unknown / total * 100) if total > 0 else 0
        
        camera_analytics.append({
            "camera_id": stat.camera_id,
            "total_events": total,
            "unknown_count": unknown,
            "unknown_rate": round(unknown_rate, 2)
        })
    
    return {"cameras": camera_analytics}


@router.get("/attendance")
def get_attendance(
    days: int = 30,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.analytics import get_all_attendance
    attendance = get_all_attendance(db, days)
    return {"attendance": attendance, "days": days}


@router.get("/anomalies")
def get_anomalies(
    days: int = 30,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.analytics import calculate_z_scores
    data = calculate_z_scores(db, days)
    anomalies = [d for d in data if d.get("is_anomaly")]
    return {"daily_data": data, "anomalies": anomalies}


@router.get("/recognition-quality")
def get_recognition_quality(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Recognition quality metrics: average similarity, unknown rate."""
    today = datetime.now().date()

    total = db.query(RecognitionEvent).filter(
        func.date(RecognitionEvent.first_seen) == today
    ).count()

    unknown = db.query(RecognitionEvent).filter(
        and_(
            func.date(RecognitionEvent.first_seen) == today,
            RecognitionEvent.is_unknown == True,
        )
    ).count()

    avg_sim = db.query(func.avg(RecognitionEvent.similarity)).filter(
        and_(
            func.date(RecognitionEvent.first_seen) == today,
            RecognitionEvent.is_unknown == False,
        )
    ).scalar() or 0.0

    return {
        "total_recognitions": total,
        "unknown_count": unknown,
        "unknown_rate": round((unknown / total * 100) if total > 0 else 0, 2),
        "average_similarity": round(float(avg_sim), 4),
    }
