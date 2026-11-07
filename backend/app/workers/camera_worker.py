# Camera worker for processing video streams
import threading
import time
from typing import Dict, Optional, Callable
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.face_engine import face_engine
from app.services.matcher import load_known_embeddings, match_embedding
from app.services.dedup import deduplicate_or_update, is_duplicate_unknown
from app.services.alerts import generate_unknown_face_alert, check_unusual_time
from app.models.event import RecognitionEvent


class CameraWorker:
    """Processes a single camera's video stream for face recognition."""

    def __init__(self, camera_id: int, stream_url: str, on_event: Optional[Callable] = None):
        self.camera_id = camera_id
        self.stream_url = stream_url
        self.on_event = on_event
        self._running = False
        self._thread: Optional[threading.Thread] = None

    def start(self):
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)

    @property
    def is_running(self) -> bool:
        return self._running

    def _run(self):
        import cv2
        cap = cv2.VideoCapture(self.stream_url)
        if not cap.isOpened():
            print(f"[camera-worker] Failed to open stream for camera {self.camera_id}")
            self._running = False
            return

        print(f"[camera-worker] Started processing camera {self.camera_id}")
        frame_interval = 2  # Process every 2 seconds

        while self._running:
            ret, frame = cap.read()
            if not ret:
                print(f"[camera-worker] Lost connection to camera {self.camera_id}")
                time.sleep(5)
                cap = cv2.VideoCapture(self.stream_url)
                continue

            self._process_frame(frame)
            time.sleep(frame_interval)

        cap.release()
        print(f"[camera-worker] Stopped camera {self.camera_id}")

    def _process_frame(self, frame):
        detections = face_engine.detect_faces_with_embeddings(frame)
        if not detections:
            return

        db = SessionLocal()
        try:
            known_embeddings = load_known_embeddings(db)

            for x, y, w, h, embedding in detections:
                if embedding is None:
                    continue

                match = match_embedding(embedding, known_embeddings)

                if match:
                    event = deduplicate_or_update(
                        db,
                        person_id=match["person_id"],
                        camera_id=self.camera_id,
                        similarity=match["similarity"],
                    )
                    check_unusual_time(db, event)
                else:
                    # Only log unknown events with cooldown to prevent flooding
                    if not is_duplicate_unknown(db, self.camera_id, cooldown_seconds=30):
                        event = RecognitionEvent(
                            camera_id=self.camera_id,
                            person_id=None,
                            similarity=0.0,
                            is_unknown=True,
                        )
                        db.add(event)
                        db.commit()
                        db.refresh(event)
                        generate_unknown_face_alert(db, event.id)
                    else:
                        event = None

                if self.on_event and event:
                    self.on_event(event)
        finally:
            db.close()


class CameraManager:
    """Manages all running camera workers."""

    def __init__(self):
        self._workers: Dict[int, CameraWorker] = {}

    def start_camera(self, camera_id: int, stream_url: str, on_event: Optional[Callable] = None):
        if camera_id in self._workers and self._workers[camera_id].is_running:
            return False
        worker = CameraWorker(camera_id, stream_url, on_event)
        worker.start()
        self._workers[camera_id] = worker
        return True

    def stop_camera(self, camera_id: int) -> bool:
        worker = self._workers.get(camera_id)
        if not worker or not worker.is_running:
            return False
        worker.stop()
        return True

    def stop_all(self):
        for worker in self._workers.values():
            worker.stop()
        self._workers.clear()

    def get_status(self, camera_id: int) -> Optional[bool]:
        worker = self._workers.get(camera_id)
        return worker.is_running if worker else None


# Global instance
camera_manager = CameraManager()
