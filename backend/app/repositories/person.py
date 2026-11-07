from sqlalchemy.orm import Session, joinedload
from app.models.person import Person
from app.models.face import FaceEmbedding
from app.schemas.person import PersonCreate, PersonUpdate
from typing import List, Optional


def get_persons(db: Session, skip: int = 0, limit: int = 100) -> List[Person]:
    return db.query(Person).options(joinedload(Person.face_embeddings)).offset(skip).limit(limit).all()


def get_person(db: Session, person_id: int) -> Optional[Person]:
    return db.query(Person).filter(Person.id == person_id).first()


def get_person_by_code(db: Session, code: str) -> Optional[Person]:
    return db.query(Person).filter(Person.code == code).first()


def create_person(db: Session, person: PersonCreate) -> Person:
    db_person = Person(
        code=person.code,
        full_name=person.full_name,
        group_id=person.group_id,
        phone=person.phone,
        consent_given=person.consent_given,
        is_active=True
    )
    db.add(db_person)
    db.commit()
    db.refresh(db_person)
    return db_person


def update_person(db: Session, person_id: int, person: PersonUpdate) -> Optional[Person]:
    db_person = get_person(db, person_id)
    if db_person:
        if person.code is not None:
            db_person.code = person.code
        if person.full_name is not None:
            db_person.full_name = person.full_name
        if person.group_id is not None:
            db_person.group_id = person.group_id
        if person.phone is not None:
            db_person.phone = person.phone
        db.commit()
        db.refresh(db_person)
    return db_person


def delete_person(db: Session, person_id: int) -> bool:
    db_person = get_person(db, person_id)
    if db_person:
        db.delete(db_person)
        db.commit()
        return True
    return False


def get_person_faces(db: Session, person_id: int) -> List[FaceEmbedding]:
    return db.query(FaceEmbedding).filter(FaceEmbedding.person_id == person_id).all()
