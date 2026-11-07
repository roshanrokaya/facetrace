"""Tests for event deduplication service."""

import pytest
from datetime import datetime, timedelta
from app.services.dedup import is_duplicate_event, deduplicate_or_update
from app.models.event import RecognitionEvent


class TestIsDuplicateEvent:
    def test_no_recent_event_returns_false(self, db, sample_camera, sample_person):
        result = is_duplicate_event(db, sample_person.id, sample_camera.id, cooldown_seconds=300)
        assert result is False

    def test_recent_event_returns_true(self, db, sample_camera, sample_person):
        event = RecognitionEvent(
            camera_id=sample_camera.id,
            person_id=sample_person.id,
            similarity=0.9,
            is_unknown=False,
        )
        db.add(event)
        db.commit()

        result = is_duplicate_event(db, sample_person.id, sample_camera.id, cooldown_seconds=300)
        assert result is True


class TestDeduplicateOrUpdate:
    def test_creates_new_event_when_no_recent(self, db, sample_camera, sample_person):
        event = deduplicate_or_update(db, sample_person.id, sample_camera.id, 0.95)
        assert event.id is not None
        assert event.person_id == sample_person.id
        assert event.similarity == 0.95

    def test_updates_existing_event_within_cooldown(self, db, sample_camera, sample_person):
        first = deduplicate_or_update(db, sample_person.id, sample_camera.id, 0.85)
        second = deduplicate_or_update(db, sample_person.id, sample_camera.id, 0.95)
        assert second.id == first.id
        assert second.similarity == 0.95  # Updated to higher similarity
