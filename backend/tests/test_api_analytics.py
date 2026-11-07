"""Tests for the analytics API endpoints."""

import pytest


class TestAnalyticsSummary:
    def test_returns_summary(self, client):
        response = client.get("/api/v1/analytics/summary")
        assert response.status_code == 200
        data = response.json()
        assert "today_entries" in data
        assert "unique_people" in data
        assert "unknown_faces" in data
        assert "open_alerts" in data


class TestAnalyticsFootfall:
    def test_returns_footfall(self, client):
        response = client.get("/api/v1/analytics/footfall")
        assert response.status_code == 200
        data = response.json()
        assert "footfall" in data
        assert len(data["footfall"]) == 30


class TestAnalyticsHeatmap:
    def test_returns_heatmap_grid(self, client):
        response = client.get("/api/v1/analytics/heatmap")
        assert response.status_code == 200
        data = response.json()
        assert "heatmap" in data
        assert len(data["heatmap"]) == 7
        assert len(data["heatmap"][0]) == 24


class TestAnalyticsDwellTime:
    def test_returns_dwell_data(self, client):
        response = client.get("/api/v1/analytics/dwell-time")
        assert response.status_code == 200
        data = response.json()
        assert "total_persons_today" in data
        assert "average_dwell_time" in data
        assert "dwell_times" in data


class TestAnalyticsCameras:
    def test_returns_camera_analytics(self, client):
        response = client.get("/api/v1/analytics/cameras")
        assert response.status_code == 200
        data = response.json()
        assert "cameras" in data


class TestAnalyticsRecognitionQuality:
    def test_returns_quality_metrics(self, auth_client):
        response = auth_client.get("/api/v1/analytics/recognition-quality")
        assert response.status_code == 200
        data = response.json()
        assert "total_recognitions" in data
        assert "unknown_rate" in data
        assert "average_similarity" in data
