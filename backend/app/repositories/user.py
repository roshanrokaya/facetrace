# User repository for database operations
from sqlalchemy.orm import Session
from app.models.user import User
from passlib.context import CryptContext
from typing import Optional, List

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_users(db: Session) -> List[User]:
    return db.query(User).all()


def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def create_user(
    db: Session,
    full_name: str,
    email: str,
    password: str,
    role: str = "viewer",
) -> User:
    user = User(
        full_name=full_name,
        email=email,
        password_hash=pwd_context.hash(password),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(
    db: Session,
    user_id: int,
    full_name: Optional[str] = None,
    email: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> Optional[User]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    if full_name is not None:
        user.full_name = full_name
    if email is not None:
        user.email = email
    if role is not None:
        user.role = role
    if is_active is not None:
        user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int) -> bool:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    db.delete(user)
    db.commit()
    return True
