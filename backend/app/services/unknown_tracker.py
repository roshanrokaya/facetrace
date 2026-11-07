"""
In-memory tracker for unknown faces.
Assigns a stable temporary ID to each unique unknown face so the frontend
can tell when the same unknown person reappears after leaving the frame.
"""

import time
import uuid
import numpy as np
from typing import Optional, Dict, List
from app.services.matcher import _to_numpy, cosine_similarity
from app.core.config import settings

# How long (seconds) to remember an unknown face after last seen
_TTL = 300  # 5 minutes


class _UnknownEntry:
    __slots__ = ("uid", "embedding", "last_seen", "label")

    def __init__(self, uid: str, embedding: np.ndarray):
        self.uid = uid
        self.embedding = embedding
        self.last_seen = time.time()
        self.label = f"Person-{uid[:6].upper()}"


class UnknownTracker:
    def __init__(self, threshold: float = 0.35, ttl: int = _TTL):
        """
        threshold: Lower than recognition threshold (0.45) because we're just
        grouping "same unknown face" not confirming identity. 0.35 is more
        forgiving for pose/lighting changes between frames.
        """
        self._entries: List[_UnknownEntry] = []
        self._threshold = threshold
        self._ttl = ttl

    def _cleanup(self):
        now = time.time()
        self._entries = [e for e in self._entries if now - e.last_seen < self._ttl]

    def match_or_register(self, embedding: np.ndarray) -> dict:
        """
        Given an unknown face embedding, check if we've seen this face before.
        Returns {"uid": str, "label": str, "is_new": bool}
        """
        self._cleanup()
        query = _to_numpy(embedding)

        # Find best match among tracked unknowns
        best: Optional[_UnknownEntry] = None
        best_sim = 0.0

        for entry in self._entries:
            sim = cosine_similarity(query, entry.embedding)
            if sim > best_sim and sim > self._threshold:
                best_sim = sim
                best = entry

        if best is not None:
            # Same unknown person — update last seen, blend embedding for stability
            best.last_seen = time.time()
            best.embedding = 0.7 * best.embedding + 0.3 * query  # running average
            return {"uid": best.uid, "label": best.label, "is_new": False}

        # New unknown person
        uid = uuid.uuid4().hex
        entry = _UnknownEntry(uid=uid, embedding=query)
        self._entries.append(entry)
        return {"uid": uid, "label": entry.label, "is_new": True}

    def count(self) -> int:
        self._cleanup()
        return len(self._entries)


# Global instance
unknown_tracker = UnknownTracker()
