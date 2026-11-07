"""Tests for the alert service."""

import pytest
from datetime import datetime
from app.services.alerts import (
    create_alert,
    get_alerts,
    acknowledge_alert,
    generate_unknown_face_alert,
    check_unusual_time,
)
from app.models.alert import Alert
from app.models.event import RecognitionEvent


class TestCreateAlert:
    def test_creates_alert(self, db):
        alert = create_alert(db, "unknown", "Unknown face detected")
        assert alert.id is not None
        assert alert.type == "unknown"
        assert alert.status == "open"

    def test_creates_alert_with_event(self, db, sample_event):
        alert = create_alert(db, "unknown", "Unknown face", event_id=sample_event.id)
        assert alert.event_id == sample_event.id


class TestGetAlerts:
    def test_returns_all_alerts(self, db):
        create_alert(db, "unknown", "Alert 1")
        create_alert(db, "low_attendance", "Alert 2")
        alerts = get_alerts(db)
        assert len(alerts) == 2

    def test_filter_by_status(self, db):
        a1 = create_alert(db, "unknown", "Alert 1")
        create_alert(db, "unknown", "Alert 2")
        acknowledge_alert(db, a1.id)

        open_alerts = get_alerts(db, status="open")
        assert len(open_alerts) == 1

        ack_alerts = get_alerts(db, status="acknowledged")
        assert len(ack_alerts) == 1


class TestAcknowledgeAlert:
    def test_acknowledges_existing_alert(self, db):
        alert = create_alert(db, "unknown", "Test alert")
        result = acknowledge_alert(db, alert.id)
        assert result is not None
        assert result.status == "acknowledged"

    def test_returns_none_for_missing_alert(self, db):
        result = acknowledge_alert(db, 9999)
        assert result is None


class TestCheckUnusualTime:
    def test_normal_time_no_alert(self, db, sample_event):
        # Patch event time to 10:00 (normal)
        sample_event.first_seen = datetime(2024, 1, 1, 10, 0)
        db.commit()
        result = check_unusual_time(db, sample_event)
        assert result is None

    def test_late_time_creates_alert(self, db, sample_event):
        sample_event.first_seen = datetime(2024, 1, 1, 23, 0)
        db.commit()
        result = check_unusual_time(db, sample_event)
        assert result is not None
        assert result.type == "unusual_time"

    def test_early_time_creates_alert(self, db, sample_event):
        sample_event.first_seen = datetime(2024, 1, 1, 3, 0)
        db.commit()
        result = check_unusual_time(db, sample_event)
        assert result is not None
        assert result.type == "unusual_time"
