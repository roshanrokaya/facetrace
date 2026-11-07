"""Tests for the reports API endpoints."""

import pytest


class TestGenerateReport:
    def test_events_report(self, auth_client):
        response = auth_client.get("/api/v1/reports/events")
        assert response.status_code == 200
        assert "text/csv" in response.headers["content-type"]

    def test_attendance_report(self, auth_client):
        response = auth_client.get("/api/v1/reports/attendance")
        assert response.status_code == 200
        assert "text/csv" in response.headers["content-type"]

    def test_daily_summary_report(self, auth_client):
        response = auth_client.get("/api/v1/reports/daily-summary")
        assert response.status_code == 200
        assert "text/csv" in response.headers["content-type"]

    def test_unknown_report_type_returns_400(self, auth_client):
        response = auth_client.get("/api/v1/reports/foobar")
        assert response.status_code == 400
