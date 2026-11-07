"""Tests for the alerts API endpoints."""

import pytest
from app.services.alerts import create_alert


class TestGetAlertsAPI:
    def test_lists_alerts(self, auth_client, db):
        create_alert(db, "unknown", "Test alert")
        response = auth_client.get("/api/v1/alerts/")
        assert response.status_code == 200
        data = response.json()
        assert "alerts" in data
        assert len(data["alerts"]) >= 1

    def test_filter_by_status(self, auth_client, db):
        create_alert(db, "unknown", "Alert 1")
        response = auth_client.get("/api/v1/alerts/?status=open")
        assert response.status_code == 200
        for alert in response.json()["alerts"]:
            assert alert["status"] == "open"


class TestAcknowledgeAlertAPI:
    def test_acknowledges_alert(self, auth_client, db):
        alert = create_alert(db, "unknown", "Test alert")
        response = auth_client.patch(f"/api/v1/alerts/{alert.id}")
        assert response.status_code == 200
        assert response.json()["data"]["status"] == "acknowledged"

    def test_nonexistent_alert_returns_404(self, auth_client):
        response = auth_client.patch("/api/v1/alerts/9999")
        assert response.status_code == 404
