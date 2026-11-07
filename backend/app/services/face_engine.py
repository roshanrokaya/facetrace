from typing import List, Tuple, Optional, Dict

class FaceEngine:
    def __init__(self):
        self.face_detector = None
        self.face_recognizer = None
        self._loaded = False

    def _ensure_loaded(self):
        """Lazy-load InsightFace models on first use."""
        if self._loaded:
            return
        self._loaded = True
        try:
            from insightface.app import FaceAnalysis
            print("Loading InsightFace models...")

            self.face_detector = FaceAnalysis(providers=['CPUExecutionProvider'])
            self.face_detector.prepare(ctx_id=-1, det_size=(640, 640))

            print("InsightFace models loaded successfully")
        except Exception as e:
            print(f"Error loading InsightFace: {e}")
            print("Falling back to demo mode")
            self.face_detector = None

    def detect_faces(self, image) -> List[Tuple[int, int, int, int]]:
        """
        Detect faces in an image using InsightFace.
        Returns list of (x, y, w, h) bounding boxes.
        """
        self._ensure_loaded()
        if self.face_detector is None:
            # Demo mode: return a mock face in the center
            h, w, _ = image.shape
            return [(w//4, h//4, w//2, h//2)]

        try:
            faces = self.face_detector.get(image)
            print(f"InsightFace detected {len(faces)} faces")
            result = []
            for face in faces:
                bbox = face.bbox.astype(int)
                result.append((bbox[0], bbox[1], bbox[2] - bbox[0], bbox[3] - bbox[1]))
            return result
        except Exception as e:
            print(f"Error detecting faces: {e}")
            return []

    def detect_faces_with_embeddings(self, image):
        """
        Detect faces and return list of (x, y, w, h, embedding) tuples.
        Returns empty list if no faces detected. No demo fallback.
        """
        self._ensure_loaded()
        if self.face_detector is None:
            return []

        try:
            faces = self.face_detector.get(image)
            result = []
            for face in faces:
                bbox = face.bbox.astype(int)
                x, y = int(bbox[0]), int(bbox[1])
                w, h = int(bbox[2] - bbox[0]), int(bbox[3] - bbox[1])
                embedding = face.embedding if hasattr(face, 'embedding') else None
                result.append((x, y, w, h, embedding))
            return result
        except Exception as e:
            print(f"Error detecting faces: {e}")
            return []

    def get_embedding(self, image, face_bbox: Tuple[int, int, int, int]) -> Optional["np.ndarray"]:
        """
        Get face embedding vector for recognition using InsightFace.
        """
        self._ensure_loaded()
        if self.face_detector is None:
            return None

        try:
            # InsightFace returns embeddings directly from get() method
            faces = self.face_detector.get(image)
            if faces and len(faces) > 0:
                # The embedding is already in the face object
                return faces[0].embedding
            return None
        except Exception as e:
            print(f"Error getting embedding: {e}")
            return None

    def recognize_face(self, embedding, known_embeddings: List[Dict]) -> Optional[Dict]:
        """
        Match face embedding against known embeddings.
        Returns best match if similarity > threshold.
        """
        from app.services.matcher import match_embedding
        return match_embedding(embedding, known_embeddings)

    def draw_faces(self, image, faces: List[Tuple[int, int, int, int]], names: List[str] = None):
        """
        Draw bounding boxes around detected faces with names.
        """
        import cv2
        result = image.copy()
        for i, (x, y, w, h) in enumerate(faces):
            cv2.rectangle(result, (x, y), (x + w, y + h), (0, 255, 0), 2)

            # Add name if provided
            if names and i < len(names):
                cv2.putText(result, names[i], (x, y - 10),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            else:
                cv2.putText(result, "Face", (x, y - 10),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        return result

    def encode_image(self, image) -> str:
        """
        Encode image to base64 string for web transmission.
        """
        import cv2
        import base64
        _, buffer = cv2.imencode('.jpg', image)
        return base64.b64encode(buffer).decode('utf-8')

    def decode_image(self, image_data: str):
        """
        Decode base64 image string to numpy array.
        """
        import cv2
        import base64
        import numpy as np
        # Remove data URL prefix if present
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        img_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

# Global instance
face_engine = FaceEngine()
