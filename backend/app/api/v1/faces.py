from fastapi import APIRouter, Depends, UploadFile, File
from app.core.deps import get_current_user, require_role

router = APIRouter()


@router.post("/{person_id}/faces")
def upload_face(
    person_id: int,
    file: UploadFile = File(...),
    current_user = Depends(require_role(["operator", "admin"]))
):
    # TODO: Implement face upload and embedding generation
    return {"message": f"Upload face for person {person_id}"}


@router.delete("/{person_id}/faces/{face_id}")
def delete_face(
    person_id: int,
    face_id: int,
    current_user = Depends(require_role(["operator", "admin"]))
):
    # TODO: Implement face deletion
    return {"message": f"Delete face {face_id} for person {person_id}"}
