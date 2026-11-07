from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, get_db
from app.services.reports import (
    generate_events_csv,
    generate_attendance_csv,
    generate_daily_summary_csv,
)
import io

router = APIRouter()


@router.get("/{report_type}")
def generate_report(
    report_type: str,
    days: int = 30,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a CSV report. Types: events, attendance, daily-summary."""
    generators = {
        "events": lambda: generate_events_csv(db),
        "attendance": lambda: generate_attendance_csv(db, days),
        "daily-summary": lambda: generate_daily_summary_csv(db, days),
    }

    if report_type not in generators:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown report type '{report_type}'. Valid: {', '.join(generators)}",
        )

    csv_content = generators[report_type]()

    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={report_type}_{days}d.csv"
        },
    )
