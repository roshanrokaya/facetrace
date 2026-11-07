"""Tests for the analytics service."""

import pytest
from datetime import datetime, timedelta
from app.services.analytics import (
    get_attendance_for_person,
    get_all_attendance,
    calculate_z_scores,
)
from app.models.event import RecognitionEvent


class TestGetAttendanceForPerson:
    def test_no_events_returns_zero(self, db, sample_person):
        result = get_attendance_for_person(db, sample_person.id, days=30)
        assert result["days_present"] == 0
        assert result["attendance_pct"] == 0

    def test_counts_distinct_days(self, db, sample_person, sample_camera):
        # Create events on 3 different days
        for i in range(3):
            event = RecognitionEvent(
                camera_id=sample_camera.id,
                person_id=sample_person.id,
                similarity=0.9,
                is_unknown=False,
            )
            db.add(event)
        db.commit()

        # All events are today (same day), so days_present should be 1
        result = get_attendance_for_person(db, sample_person.id, days=30)
        assert result["days_present"] == 1


class TestCalculateZScores:
    def test_returns_data_for_each_day(self, db):
        data = calculate_z_scores(db, days=7)
        assert len(data) == 8  # 7 days + today

    def test_z_scores_have_expected_keys(self, db):
        data = calculate_z_scores(db, days=7)
        for entry in data:
            assert "date" in entry
            assert "count" in entry
            assert "z_score" in entry
            assert "is_anomaly" in entry
