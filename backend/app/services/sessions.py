# Entry/exit session pairing and dwell time calculation
from datetime import datetime, timedelta
from sqlalchemy.orm import Session as DBSession
from sqlalchemy import and_
from app.models.event import RecognitionEvent, Session as EntrySession
from typing import Optional, List


def open_session(
    db: DBSession,
    person_id: int,
    entry_event_id: int,
    entry_time: datetime,
) -> EntrySession:
    """Create a new entry session for a person."""
    session = EntrySession(
        person_id=person_id,
        entry_event_id=entry_event_id,
        entry_time=entry_time,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def close_session(
    db: DBSession,
    session_id: int,
    exit_event_id: int,
    exit_time: datetime,
) -> Optional[EntrySession]:
    """Close an open session by recording exit time and dwell duration."""
    session = db.query(EntrySession).filter(EntrySession.id == session_id).first()
    if not session:
        return None
    session.exit_event_id = exit_event_id
    session.exit_time = exit_time
    session.dwell_seconds = int((exit_time - session.entry_time).total_seconds())
    db.commit()
    db.refresh(session)
    return session


def get_open_session(
    db: DBSession,
    person_id: int,
) -> Optional[EntrySession]:
    """Get the most recent open (no exit) session for a person."""
    return (
        db.query(EntrySession)
        .filter(
            and_(
                EntrySession.person_id == person_id,
                EntrySession.exit_time.is_(None),
            )
        )
        .order_by(EntrySession.entry_time.desc())
        .first()
    )


def close_stale_sessions(
    db: DBSession,
    max_open_hours: int = 12,
) -> int:
    """
    Close sessions that have been open longer than max_open_hours.
    Used by nightly scheduler to clean up forgotten exits.
    Returns the number of sessions closed.
    """
    cutoff = datetime.utcnow() - timedelta(hours=max_open_hours)
    stale = (
        db.query(EntrySession)
        .filter(
            and_(
                EntrySession.exit_time.is_(None),
                EntrySession.entry_time < cutoff,
            )
        )
        .all()
    )
    for session in stale:
        session.exit_time = session.entry_time + timedelta(hours=max_open_hours)
        session.dwell_seconds = max_open_hours * 3600
    db.commit()
    return len(stale)


def get_person_sessions(
    db: DBSession,
    person_id: int,
    days: int = 30,
) -> List[EntrySession]:
    """Get sessions for a person over the last N days."""
    cutoff = datetime.utcnow() - timedelta(days=days)
    return (
        db.query(EntrySession)
        .filter(
            and_(
                EntrySession.person_id == person_id,
                EntrySession.entry_time >= cutoff,
            )
        )
        .order_by(EntrySession.entry_time.desc())
        .all()
    )
