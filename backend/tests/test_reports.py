"""Tests for the report generation service."""

import pytest
from app.services.reports import (
    generate_events_csv,
    generate_attendance_csv,
    generate_daily_summary_csv,
)


class TestGenerateEventsCsv:
    def test_empty_events_has_header(self, db):
        csv = generate_events_csv(db)
        lines = csv.strip().split("\n")
        assert len(lines) == 1  # header only
        assert "id" in lines[0]
        assert "camera_id" in lines[0]

    def test_includes_event_data(self, db, sample_event):
        csv = generate_events_csv(db)
        lines = csv.strip().split("\n")
        assert len(lines) == 2  # header + 1 event
        assert str(sample_event.id) in lines[1]


class TestGenerateAttendanceCsv:
    def test_has_header(self, db):
        csv = generate_attendance_csv(db, days=30)
        lines = csv.strip().split("\n")
        assert "code" in lines[0]
        assert "attendance_pct" in lines[0]

    def test_includes_person_data(self, db, sample_person):
        csv = generate_attendance_csv(db, days=30)
        assert sample_person.code in csv


class TestGenerateDailySummaryCsv:
    def test_has_correct_columns(self, db):
        csv = generate_daily_summary_csv(db, days=7)
        header = csv.strip().split("\n")[0]
        assert "date" in header
        assert "total_entries" in header
        assert "unique_persons" in header
        assert "unknown_count" in header

    def test_correct_number_of_days(self, db):
        csv = generate_daily_summary_csv(db, days=7)
        lines = csv.strip().split("\n")
        # header + 8 days (7 days ago through today inclusive)
        assert len(lines) == 9
