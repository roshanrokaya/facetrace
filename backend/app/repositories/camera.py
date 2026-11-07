from sqlalchemy.orm import Session
from app.models.camera import Camera
from app.schemas.camera import CameraCreate, CameraUpdate
from typing import List, Optional


def get_cameras(db: Session, skip: int = 0, limit: int = 100) -> List[Camera]:
    return db.query(Camera).offset(skip).limit(limit).all()


def get_camera(db: Session, camera_id: int) -> Optional[Camera]:
    return db.query(Camera).filter(Camera.id == camera_id).first()


def create_camera(db: Session, camera: CameraCreate) -> Camera:
    db_camera = Camera(
        name=camera.name,
        location=camera.location,
        stream_url=camera.stream_url,
        role=camera.role,
        is_active=True
    )
    db.add(db_camera)
    db.commit()
    db.refresh(db_camera)
    return db_camera


def update_camera(db: Session, camera_id: int, camera: CameraUpdate) -> Optional[Camera]:
    db_camera = get_camera(db, camera_id)
    if db_camera:
        db_camera.name = camera.name
        db_camera.location = camera.location
        db_camera.stream_url = camera.stream_url
        db_camera.role = camera.role
        db.commit()
        db.refresh(db_camera)
    return db_camera


def delete_camera(db: Session, camera_id: int) -> bool:
    db_camera = get_camera(db, camera_id)
    if db_camera:
        db.delete(db_camera)
        db.commit()
        return True
    return False
