"""Tests for the users API endpoints."""

import pytest


class TestGetUsers:
    def test_lists_users(self, auth_client, admin_user):
        response = auth_client.get("/api/v1/users/")
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert len(data["users"]) >= 1


class TestCreateUser:
    def test_creates_user(self, auth_client):
        response = auth_client.post("/api/v1/users/", json={
            "full_name": "New User",
            "email": "new@test.com",
            "password": "pass123",
            "role": "viewer",
        })
        assert response.status_code == 200
        assert response.json()["data"]["email"] == "new@test.com"

    def test_duplicate_email_rejected(self, auth_client, admin_user):
        response = auth_client.post("/api/v1/users/", json={
            "full_name": "Dupe",
            "email": admin_user.email,
            "password": "pass123",
            "role": "viewer",
        })
        assert response.status_code == 400


class TestUpdateUser:
    def test_updates_user(self, auth_client, admin_user):
        response = auth_client.patch(f"/api/v1/users/{admin_user.id}", json={
            "full_name": "Updated Name",
        })
        assert response.status_code == 200
        assert response.json()["message"] == "User updated"

    def test_update_nonexistent_returns_404(self, auth_client):
        response = auth_client.patch("/api/v1/users/9999", json={
            "full_name": "Nobody",
        })
        assert response.status_code == 404


class TestDeleteUser:
    def test_cannot_delete_self(self, auth_client, admin_user):
        response = auth_client.delete(f"/api/v1/users/{admin_user.id}")
        assert response.status_code == 400

    def test_delete_nonexistent_returns_404(self, auth_client):
        response = auth_client.delete("/api/v1/users/9999")
        assert response.status_code == 404
