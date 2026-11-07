"""Tests for the session management service."""

import pytest
from datetime import datetime, timedelta
from app.services.sessions import (
    open_session,
    close_session,
    get_open_session,
    close_stale_sessions,
    get_person_sessions,
)
from app.models.event import Session as EntrySession


class TestOpenSession:
    def test_creates_session(self, db, sample_person, sample_event):
        session = open_session(db, sample_person.id, sample_event.id, datetime.utcnow())
        assert session.id is not None
        assert session.person_id == sample_person.id
        assert session.exit_time is None


class TestCloseSession:
    def test_closes_session(self, db, sample_person, sample_event):
        session = open_session(db, sample_person.id, sample_event.id, datetime.utcnow() - timedelta(hours=2))
        closed = close_session(db, session.id, sample_event.id, datetime.utcnow())
        assert closed is not None
        assert closed.exit_time is not None
        assert closed.dwell_seconds > 0

    def test_returns_none_for_missing(self, db):
        result = close_session(db, 9999, 1, datetime.utcnow())
        assert result is None


class TestGetOpenSession:
    def test_finds_open_session(self, db, sample_person, sample_event):
        open_session(db, sample_person.id, sample_event.id, datetime.utcnow())
        found = get_open_session(db, sample_person.id)
        assert found is not None
        assert found.exit_time is None

    def test_returns_none_when_no_open(self, db, sample_person):
        found = get_open_session(db, sample_person.id)
        assert found is None


class TestCloseStaleSessions:
    def test_closes_stale_sessions(self, db, sample_person, sample_event):
        session = open_session(
            db, sample_person.id, sample_event.id,
            datetime.utcnow() - timedelta(hours=15)
        )
        closed_count = close_stale_sessions(db, max_open_hours=12)
        assert closed_count == 1

        db.refresh(session)
        assert session.exit_time is not None

    def test_does_not_close_recent_sessions(self, db, sample_person, sample_event):
        open_session(db, sample_person.id, sample_event.id, datetime.utcnow())
        closed_count = close_stale_sessions(db, max_open_hours=12)
        assert closed_count == 0
