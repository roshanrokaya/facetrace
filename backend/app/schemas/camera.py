from pydantic import BaseModel
from typing import Optional


class CameraBase(BaseModel):
    name: str
    location: str
    stream_url: str
    role: str = "general"


class CameraCreate(CameraBase):
    pass


class CameraUpdate(CameraBase):
    pass


class Camera(CameraBase):
    id: int
    is_active: bool
    last_heartbeat: Optional[str] = None

    class Config:
        from_attributes = True
