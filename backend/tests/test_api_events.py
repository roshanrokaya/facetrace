"""Tests for the events API endpoints."""

import pytest


class TestGetEventsAPI:
    def test_lists_events(self, auth_client, sample_event):
        response = auth_client.get("/api/v1/events/")
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        assert len(data["events"]) >= 1

    def test_event_has_expected_fields(self, auth_client, sample_event):
        response = auth_client.get("/api/v1/events/")
        event = response.json()["events"][0]
        assert "id" in event
        assert "camera_id" in event
        assert "person_name" in event
        assert "is_unknown" in event


class TestLabelEventAPI:
    def test_labels_unknown_event(self, auth_client, db, sample_camera, sample_person):
        from app.models.event import RecognitionEvent
        event = RecognitionEvent(
            camera_id=sample_camera.id,
            person_id=None,
            similarity=0.0,
            is_unknown=True,
        )
        db.add(event)
        db.commit()

        response = auth_client.post(
            f"/api/v1/events/{event.id}/label",
            json={"person_id": sample_person.id},
        )
        assert response.status_code == 200
        assert response.json()["data"]["person_id"] == sample_person.id
        assert response.json()["data"]["is_unknown"] is False

    def test_label_nonexistent_returns_404(self, auth_client):
        response = auth_client.post(
            "/api/v1/events/9999/label",
            json={"person_id": 1},
        )
        assert response.status_code == 404
