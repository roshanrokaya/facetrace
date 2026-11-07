"""
Seed script — creates a default admin user so you can log in immediately.

Usage:
    cd backend
    python seed.py

Default credentials:
    Email:    admin@facetrace.io
    Password: admin123
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

ADMIN_EMAIL = "admin@facetrace.io"
ADMIN_PASSWORD = "admin123"
ADMIN_NAME = "System Admin"


def seed():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if existing:
            print(f"Admin user already exists: {ADMIN_EMAIL}")
            return

        admin = User(
            full_name=ADMIN_NAME,
            email=ADMIN_EMAIL,
            password_hash=get_password_hash(ADMIN_PASSWORD),
            role="admin",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print(f"Created admin user: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        print("Change this password after first login!")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
