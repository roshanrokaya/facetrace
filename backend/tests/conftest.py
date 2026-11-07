"""Shared test fixtures for the FACETRACE backend test suite."""

import pytest
from unittest.mock import MagicMock, patch
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from fastapi.testclient import TestClient

# Patch pgvector before importing models so SQLite can be used
import sqlalchemy
_original_vector = None
try:
    from pgvector.sqlalchemy import Vector
    _original_vector = Vector
except ImportError:
    pass

# Replace Vector with a simple String column for testing (SQLite has no pgvector)
from unittest.mock import MagicMock
import app.db.base as base_module

# We need to use a real SQLAlchemy type for the Vector column in tests
from sqlalchemy import String as _String, LargeBinary


class FakeVector(_String):
    """Stand-in for pgvector.Vector that works with SQLite."""
    def __init__(self, dim=None, *args, **kwargs):
        super().__init__(*args, **kwargs)


# Monkey-patch before model imports
import pgvector.sqlalchemy
pgvector.sqlalchemy.Vector = FakeVector

from app.db.base import Base
from app.models.user import User
from app.models.person import Person
from app.models.camera import Camera
from app.models.event import RecognitionEvent, Session as EntrySession
from app.models.face import FaceEmbedding
from app.models.alert import Alert
from app.core.security import get_password_hash, create_access_token
from app.core.deps import get_db, get_current_user
from app.main import app


SQLALCHEMY_TEST_URL = "sqlite:///./test.db"

engine = create_engine(SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    """Create all tables before each test and drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    """Provide a test database session."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    """Provide a FastAPI test client with overridden DB dependency."""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db):
    """Create an admin user and return it."""
    user = User(
        full_name="Admin User",
        email="admin@test.com",
        password_hash=get_password_hash("password123"),
        role="admin",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_token(admin_user):
    """Create a valid JWT token for the admin user."""
    return create_access_token(data={"sub": admin_user.email})


@pytest.fixture
def auth_client(client, admin_user, admin_token):
    """Test client with admin auth headers."""
    def override_get_current_user():
        return admin_user

    app.dependency_overrides[get_current_user] = override_get_current_user
    client.headers["Authorization"] = f"Bearer {admin_token}"
    yield client
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
def sample_person(db):
    """Create a sample person."""
    person = Person(
        code="STU001",
        full_name="John Doe",
        group_id="CS-A",
        consent_given=True,
        is_active=True,
    )
    db.add(person)
    db.commit()
    db.refresh(person)
    return person


@pytest.fixture
def sample_camera(db):
    """Create a sample camera."""
    camera = Camera(
        name="Main Entrance",
        location="Building A",
        stream_url="rtsp://localhost:554/stream1",
        role="entry",
        is_active=True,
    )
    db.add(camera)
    db.commit()
    db.refresh(camera)
    return camera


@pytest.fixture
def sample_event(db, sample_camera, sample_person):
    """Create a sample recognition event."""
    event_obj = RecognitionEvent(
        camera_id=sample_camera.id,
        person_id=sample_person.id,
        similarity=0.95,
        is_unknown=False,
    )
    db.add(event_obj)
    db.commit()
    db.refresh(event_obj)
    return event_obj
