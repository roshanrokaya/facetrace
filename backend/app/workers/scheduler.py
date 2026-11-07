# APScheduler for nightly jobs (session closing, attendance, cleanup)
from apscheduler.schedulers.background import BackgroundScheduler
from app.db.session import SessionLocal
from app.services.sessions import close_stale_sessions
from app.services.alerts import check_low_attendance
from app.models.person import Person
import os
from datetime import datetime

scheduler = BackgroundScheduler()


def nightly_close_sessions():
    """Close sessions that have been open too long."""
    db = SessionLocal()
    try:
        closed = close_stale_sessions(db, max_open_hours=12)
        print(f"[scheduler] Closed {closed} stale sessions at {datetime.utcnow()}")
    finally:
        db.close()


def nightly_attendance_check():
    """Check attendance and create alerts for low attendance."""
    db = SessionLocal()
    try:
        persons = db.query(Person).filter(Person.is_active == True).all()
        alert_count = 0
        for person in persons:
            alert = check_low_attendance(db, person.id)
            if alert:
                alert_count += 1
        print(f"[scheduler] Created {alert_count} low-attendance alerts at {datetime.utcnow()}")
    finally:
        db.close()


def nightly_snapshot_cleanup():
    """Delete snapshots older than the retention period."""
    retention_days = int(os.environ.get("SNAPSHOT_RETENTION_DAYS", "30"))
    storage_dir = "storage/snapshots"
    if not os.path.exists(storage_dir):
        return

    cutoff = datetime.utcnow().timestamp() - (retention_days * 86400)
    deleted = 0
    for filename in os.listdir(storage_dir):
        filepath = os.path.join(storage_dir, filename)
        if os.path.isfile(filepath) and os.path.getmtime(filepath) < cutoff:
            os.remove(filepath)
            deleted += 1
    print(f"[scheduler] Deleted {deleted} old snapshots at {datetime.utcnow()}")


def start_scheduler():
    """Start the background scheduler with nightly jobs."""
    scheduler.add_job(nightly_close_sessions, "cron", hour=2, minute=0)
    scheduler.add_job(nightly_attendance_check, "cron", hour=2, minute=15)
    scheduler.add_job(nightly_snapshot_cleanup, "cron", hour=3, minute=0)
    scheduler.start()
    print("[scheduler] Background scheduler started")


def stop_scheduler():
    """Shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown()
