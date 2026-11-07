from pydantic import BaseModel
from typing import Optional


class PersonBase(BaseModel):
    code: str
    full_name: str
    group_id: Optional[str] = None
    phone: Optional[str] = None
    consent_given: bool = False


class PersonCreate(PersonBase):
    pass


class PersonUpdate(BaseModel):
    code: Optional[str] = None
    full_name: Optional[str] = None
    group_id: Optional[str] = None
    phone: Optional[str] = None


class Person(PersonBase):
    id: int
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True
