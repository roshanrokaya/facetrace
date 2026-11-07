from fastapi import APIRouter, Depends, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, require_role, get_db
from app.repositories.camera import get_cameras, get_camera, create_camera, update_camera, delete_camera
from app.schemas.camera import CameraCreate, CameraUpdate
from app.services.face_engine import face_engine
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class DetectionRequest(BaseModel):
    image: Optional[str] = None


@router.get("/")
def get_cameras_route(db: Session = Depends(get_db)):
    cameras = get_cameras(db)
    return {"cameras": cameras}


@router.post("/")
def create_camera_route(camera: CameraCreate, db: Session = Depends(get_db)):
    db_camera = create_camera(db, camera)
    return {"message": "Create camera", "data": db_camera}


@router.get("/{camera_id}")
def get_camera_route(camera_id: int, db: Session = Depends(get_db)):
    camera = get_camera(db, camera_id)
    if not camera:
        return {"error": "Camera not found"}, 404
    return camera


@router.patch("/{camera_id}")
def update_camera_route(camera_id: int, camera: CameraUpdate, db: Session = Depends(get_db)):
    db_camera = update_camera(db, camera_id, camera)
    if not db_camera:
        return {"error": "Camera not found"}, 404
    return {"message": "Camera updated", "data": db_camera}


@router.delete("/{camera_id}")
def delete_camera_route(camera_id: int, db: Session = Depends(get_db)):
    success = delete_camera(db, camera_id)
    if not success:
        return {"error": "Camera not found"}, 404
    return {"message": "Camera deleted"}


@router.post("/{camera_id}/start")
def start_camera(
    camera_id: int,
    current_user=Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    camera = get_camera(db, camera_id)
    if not camera:
        return {"error": "Camera not found"}, 404
    from app.workers.camera_worker import camera_manager
    started = camera_manager.start_camera(camera_id, camera.stream_url)
    if not started:
        return {"message": f"Camera {camera_id} is already running"}
    return {"message": f"Camera {camera_id} started"}


@router.post("/{camera_id}/stop")
def stop_camera(
    camera_id: int,
    current_user=Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    camera = get_camera(db, camera_id)
    if not camera:
        return {"error": "Camera not found"}, 404
    from app.workers.camera_worker import camera_manager
    stopped = camera_manager.stop_camera(camera_id)
    if not stopped:
        return {"message": f"Camera {camera_id} is not running"}
    return {"message": f"Camera {camera_id} stopped"}


@router.post("/{camera_id}/test")
def test_camera(
    camera_id: int,
    current_user=Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    camera = get_camera(db, camera_id)
    if not camera:
        return {"error": "Camera not found"}, 404
    import cv2
    cap = cv2.VideoCapture(camera.stream_url)
    success = cap.isOpened()
    if success:
        ret, _ = cap.read()
        success = ret
    cap.release()
    return {
        "camera_id": camera_id,
        "stream_url": camera.stream_url,
        "reachable": success,
    }


@router.post("/test-detection")
async def test_face_detection(request: dict = Body(...), db: Session = Depends(get_db)):
    """Test face detection with real recognition using InsightFace."""
    import cv2
    import numpy as np
    import base64
    try:
        image = request.get("image")
        if not image:
            return {"error": "No image provided"}, 400

        # Use provided camera_id or fall back to the first camera in DB
        camera_id = request.get("camera_id")
        if camera_id is None:
            first_camera = get_cameras(db)
            camera_id = first_camera[0].id if first_camera else None

        img = face_engine.decode_image(image)
        if img is None:
            return {"error": "Invalid image"}, 400

        # Real detection only - no demo fallback
        detections = face_engine.detect_faces_with_embeddings(img)

        from app.models.event import RecognitionEvent
        from app.services.matcher import load_known_embeddings_cached

        known_embeddings = load_known_embeddings_cached(db)

        detected_persons = []
        # Track original image dimensions for bbox scaling on the frontend
        img_h, img_w = img.shape[:2]

        from app.services.dedup import is_duplicate_event
        from app.services.unknown_tracker import unknown_tracker
        from app.services.alerts import generate_unknown_face_alert
        import os, time as _time

        snapshot_dir = "storage/snapshots"
        os.makedirs(snapshot_dir, exist_ok=True)

        def save_face_crop(image, x, y, w, h):
            """Crop and save the face region with some padding."""
            pad = int(max(w, h) * 0.3)
            y1 = max(0, y - pad)
            y2 = min(image.shape[0], y + h + pad)
            x1 = max(0, x - pad)
            x2 = min(image.shape[1], x + w + pad)
            crop = image[y1:y2, x1:x2]
            filename = f"face_{int(_time.time()*1000)}.jpg"
            filepath = os.path.join(snapshot_dir, filename)
            cv2.imwrite(filepath, crop)
            return filename

        for (x, y, w, h, embedding) in detections:
            bbox = {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}

            if embedding is not None:
                match = face_engine.recognize_face(embedding, known_embeddings)
                if match:
                    detected_persons.append({
                        "id": match['person_id'],
                        "name": match['person_name'],
                        "similarity": float(match['similarity']),
                        "recognized": True,
                        "bbox": bbox,
                    })

                    if not is_duplicate_event(db, match['person_id'], camera_id, cooldown_seconds=60):
                        snap = save_face_crop(img, x, y, w, h)
                        event = RecognitionEvent(
                            camera_id=camera_id,
                            person_id=match['person_id'],
                            similarity=match['similarity'],
                            is_unknown=False,
                            snapshot_path=snap,
                        )
                        db.add(event)
                else:
                    tracked = unknown_tracker.match_or_register(embedding)
                    detected_persons.append({
                        "uid": tracked["uid"],
                        "name": tracked["label"],
                        "similarity": 0.0,
                        "recognized": False,
                        "bbox": bbox,
                    })

                    if camera_id and tracked["is_new"]:
                        snap = save_face_crop(img, x, y, w, h)
                        event = RecognitionEvent(
                            camera_id=camera_id,
                            person_id=None,
                            similarity=0.0,
                            is_unknown=True,
                            snapshot_path=snap,
                        )
                        db.add(event)
                        db.flush()  # get event.id before commit
                        generate_unknown_face_alert(db, event.id)
            else:
                detected_persons.append({
                    "name": "Unknown",
                    "similarity": 0.0,
                    "recognized": False,
                    "bbox": bbox,
                })

        db.commit()

        result = {
            "faces_detected": len(detections),
            "detected_persons": detected_persons,
            "image_width": img_w,
            "image_height": img_h,
        }

        # If client requests annotated image (for test-detection page)
        if request.get("return_image"):
            result_image = img.copy()
            for p in detected_persons:
                b = p.get("bbox")
                if b:
                    color = (0, 255, 0) if p.get("recognized") else (0, 165, 255)
                    cv2.rectangle(result_image, (b["x"], b["y"]), (b["x"]+b["w"], b["y"]+b["h"]), color, 2)
                    cv2.putText(result_image, p["name"], (b["x"], b["y"]-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
            _, buffer = cv2.imencode('.jpg', result_image)
            result["image"] = f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}, 500
