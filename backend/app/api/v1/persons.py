from fastapi import APIRouter, Depends, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, require_role, get_db
from app.repositories.person import get_persons, get_person, create_person, update_person, delete_person, get_person_faces
from app.schemas.person import PersonCreate, PersonUpdate
from app.models.face import FaceEmbedding
from typing import Optional, List
import os

router = APIRouter()


@router.get("/")
def get_persons_route(db: Session = Depends(get_db)):
    persons = get_persons(db)
    # face_embeddings are eager-loaded via joinedload
    persons_with_faces = []
    for person in persons:
        faces = person.face_embeddings
        person_dict = {
            "id": person.id,
            "code": person.code,
            "full_name": person.full_name,
            "group_id": person.group_id,
            "phone": person.phone,
            "consent_given": person.consent_given,
            "is_active": person.is_active,
            "face_count": len(faces),
            "faces": [{"id": f.id, "image_path": f.image_path} for f in faces]
        }
        persons_with_faces.append(person_dict)
    return {"persons": persons_with_faces}


@router.post("/")
async def create_person_route(
    code: str = Form(...),
    full_name: str = Form(...),
    group_id: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    consent_given: str = Form(...),
    face_0: Optional[UploadFile] = File(None),
    face_1: Optional[UploadFile] = File(None),
    face_2: Optional[UploadFile] = File(None),
    face_3: Optional[UploadFile] = File(None),
    face_4: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    person_data = PersonCreate(
        code=code,
        full_name=full_name,
        group_id=group_id,
        phone=phone,
        consent_given=consent_given.lower() == 'true'
    )
    
    # Check if code already exists
    from app.repositories.person import get_person_by_code
    if get_person_by_code(db, code):
        return {"error": "Person with this code already exists"}, 400
    
    new_person = create_person(db, person_data)

    # Save uploaded face images and generate embeddings
    face_files = [f for f in [face_0, face_1, face_2, face_3, face_4] if f is not None]
    face_count = 0

    if face_files:
        import cv2
        import numpy as np
        from app.services.face_engine import face_engine

        storage_dir = "storage/enrollments"
        os.makedirs(storage_dir, exist_ok=True)

        for idx, face_file in enumerate(face_files):
            try:
                contents = await face_file.read()
                if not contents:
                    continue

                nparr = np.frombuffer(contents, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if img is None:
                    continue

                # Generate embedding
                embedding = None
                try:
                    faces = face_engine.face_detector.get(img) if face_engine.face_detector else []
                    if faces and len(faces) > 0 and faces[0].embedding is not None:
                        embedding = faces[0].embedding.tolist()
                except Exception as e:
                    print(f"Error generating embedding for face {idx}: {e}")

                if embedding is None:
                    print(f"Skipping face {idx} — no embedding generated (InsightFace may not be loaded)")
                    continue

                # Save image to disk
                image_filename = f"{new_person.id}_face_{idx + 1}.jpg"
                image_path = os.path.join(storage_dir, image_filename)
                cv2.imwrite(image_path, img)

                # Save to database
                face = FaceEmbedding(
                    person_id=new_person.id,
                    embedding=embedding,
                    image_path=f"/api/v1/images/{image_filename}",
                    quality_score=0.0,
                )
                db.add(face)
                face_count += 1
            except Exception as e:
                print(f"Error saving face {idx}: {e}")
                continue

        if face_count > 0:
            db.commit()
            from app.services.matcher import invalidate_embeddings_cache
            invalidate_embeddings_cache()

    return {"message": "Person created", "data": {**new_person.__dict__, "face_count": face_count}}


@router.get("/{person_id}")
def get_person_route(person_id: int, db: Session = Depends(get_db)):
    person = get_person(db, person_id)
    if not person:
        return {"error": "Person not found"}, 404
    
    faces = get_person_faces(db, person_id)
    person_dict = {
        "id": person.id,
        "code": person.code,
        "full_name": person.full_name,
        "group_id": person.group_id,
        "phone": person.phone,
        "consent_given": person.consent_given,
        "is_active": person.is_active,
        "faces": [{"id": f.id, "image_path": f.image_path} for f in faces]
    }
    return person_dict


@router.patch("/{person_id}")
def update_person_route(
    person_id: int,
    person_update: PersonUpdate = Body(...),
    db: Session = Depends(get_db),
):
    person = get_person(db, person_id)
    if not person:
        return {"error": "Person not found"}, 404

    updated_person = update_person(db, person_id, person_update)
    return {"message": "Person updated", "data": updated_person}


@router.delete("/{person_id}")
def delete_person_route(person_id: int, db: Session = Depends(get_db)):
    success = delete_person(db, person_id)
    if not success:
        return {"error": "Person not found"}, 404
    return {"message": "Person deleted"}


@router.post("/{person_id}/faces")
async def add_face_route(
    person_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    person = get_person(db, person_id)
    if not person:
        return {"error": "Person not found"}, 404

    try:
        import cv2
        import numpy as np
        # Read image
        contents = await file.read()

        if not contents:
            return {"error": "No image data provided"}, 400

        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"error": "Invalid image format"}, 400

        # Generate real face embedding using InsightFace
        from app.services.face_engine import face_engine  # noqa: lazy import avoids circular
        embedding = None
        
        try:
            # InsightFace get() returns faces with embeddings directly
            faces = face_engine.face_detector.get(img)
            if faces and len(faces) > 0:
                # The embedding is in the face object
                embedding = faces[0].embedding
                if embedding is not None:
                    embedding = embedding.tolist()
                else:
                    print("No embedding in face object")
            else:
                print("No faces detected")
        except Exception as e:
            print(f"Error generating embedding: {e}")
        
        if embedding is None:
            return {"error": "No face detected in image — please upload a clear face photo"}, 400

        # Get current face count
        existing_faces = get_person_faces(db, person_id)
        face_count = len(existing_faces) + 1

        # Save image to disk
        storage_dir = "storage/enrollments"
        os.makedirs(storage_dir, exist_ok=True)

        image_filename = f"{person_id}_face_{face_count}.jpg"
        image_path = os.path.join(storage_dir, image_filename)
        cv2.imwrite(image_path, img)

        face = FaceEmbedding(
            person_id=person_id,
            embedding=embedding,
            image_path=f"/api/v1/images/{image_filename}",
            quality_score=0.0
        )
        db.add(face)
        db.commit()

        return {"message": "Face added successfully"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}, 500


@router.delete("/{person_id}/faces/{face_id}")
def delete_face_route(person_id: int, face_id: int, db: Session = Depends(get_db)):
    face = db.query(FaceEmbedding).filter(FaceEmbedding.id == face_id, FaceEmbedding.person_id == person_id).first()
    if not face:
        return {"error": "Face not found"}, 404
    
    db.delete(face)
    db.commit()
    return {"message": "Face deleted successfully"}


