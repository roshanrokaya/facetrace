from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, require_role, get_db
from app.repositories.user import (
    get_users as repo_get_users,
    get_user,
    create_user as repo_create_user,
    update_user as repo_update_user,
    delete_user as repo_delete_user,
    get_user_by_email,
)
from pydantic import BaseModel, EmailStr
from typing import Optional

router = APIRouter()


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "viewer"


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("/")
def get_users(
    current_user=Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    users = repo_get_users(db)
    return {
        "users": [
            {
                "id": u.id,
                "full_name": u.full_name,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ]
    }


@router.post("/")
def create_user(
    user_data: UserCreate,
    current_user=Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    if get_user_by_email(db, user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = repo_create_user(
        db,
        full_name=user_data.full_name,
        email=user_data.email,
        password=user_data.password,
        role=user_data.role,
    )
    return {"message": "User created", "data": {"id": user.id, "email": user.email}}


@router.patch("/{user_id}")
def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user=Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    user = repo_update_user(
        db,
        user_id,
        full_name=user_data.full_name,
        email=user_data.email,
        role=user_data.role,
        is_active=user_data.is_active,
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User updated", "data": {"id": user.id, "email": user.email}}


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user=Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    success = repo_delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}
