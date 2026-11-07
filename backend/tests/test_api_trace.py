"""Tests for the trace API endpoints."""

import pytest


class TestGetPersonTrace:
    def test_returns_trace_timeline(self, auth_client, sample_event, sample_person):
        response = auth_client.get(f"/api/v1/trace/{sample_person.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["person"]["id"] == sample_person.id
        assert "timeline" in data
        assert data["total_events"] >= 1

    def test_nonexistent_person_returns_404(self, auth_client):
        response = auth_client.get("/api/v1/trace/9999")
        assert response.status_code == 404
