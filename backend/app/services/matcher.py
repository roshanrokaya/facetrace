# Cosine similarity matching and top-k voting
import numpy as np
from typing import List, Dict, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.face import FaceEmbedding
from app.models.person import Person
from app.core.config import settings


def _to_numpy(embedding) -> np.ndarray:
    """Safely convert any embedding (pgvector Vector, list, ndarray) to float32 numpy array."""
    if isinstance(embedding, np.ndarray):
        return embedding.astype(np.float32)
    # pgvector Vector objects and plain lists both support list()
    return np.array(list(embedding), dtype=np.float32)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def match_embedding(
    embedding: np.ndarray,
    known_embeddings: List[Dict],
    threshold: float = None,
) -> Optional[Dict]:
    """
    Match a face embedding against known embeddings using cosine similarity.
    Returns the best match above the threshold, or None.
    """
    if threshold is None:
        threshold = settings.FACE_RECOGNITION_THRESHOLD

    query_emb = _to_numpy(embedding)
    best_match = None
    best_similarity = 0.0

    for known in known_embeddings:
        known_emb = _to_numpy(known["embedding"])
        # Skip zero-vectors (bad enrollments)
        if np.linalg.norm(known_emb) == 0:
            continue
        similarity = cosine_similarity(query_emb, known_emb)

        if similarity > best_similarity and similarity > threshold:
            best_similarity = similarity
            best_match = {
                "person_id": known["person_id"],
                "person_name": known["person_name"],
                "similarity": float(similarity),
            }

    return best_match


def top_k_vote(
    embedding: np.ndarray,
    known_embeddings: List[Dict],
    k: int = 3,
    threshold: float = None,
) -> Optional[Dict]:
    """
    Match using top-k voting: find the k most similar embeddings and vote
    on the person_id. Useful when each person has multiple face embeddings.
    """
    if threshold is None:
        threshold = settings.FACE_RECOGNITION_THRESHOLD

    query_emb = _to_numpy(embedding)
    similarities = []
    for known in known_embeddings:
        known_emb = _to_numpy(known["embedding"])
        if np.linalg.norm(known_emb) == 0:
            continue
        sim = cosine_similarity(query_emb, known_emb)
        if sim > threshold:
            similarities.append((sim, known["person_id"], known["person_name"]))

    if not similarities:
        return None

    # Sort by similarity descending, take top-k
    similarities.sort(key=lambda x: x[0], reverse=True)
    top_k = similarities[:k]

    # Vote by person_id
    votes: Dict[int, float] = {}
    names: Dict[int, str] = {}
    for sim, pid, pname in top_k:
        votes[pid] = votes.get(pid, 0) + sim
        names[pid] = pname

    # Winner is the person with highest cumulative similarity
    winner_id = max(votes, key=votes.get)
    avg_sim = votes[winner_id] / sum(1 for _, pid, _ in top_k if pid == winner_id)

    return {
        "person_id": winner_id,
        "person_name": names[winner_id],
        "similarity": float(avg_sim),
    }


def load_known_embeddings(db: Session) -> List[Dict]:
    """Load all known face embeddings from the database, pre-converted to numpy arrays."""
    faces = db.query(FaceEmbedding).options(joinedload(FaceEmbedding.person)).all()
    known = []
    for face in faces:
        if face.embedding is not None and face.person:
            emb = _to_numpy(face.embedding)
            # Skip zero-vectors (failed enrollments)
            if np.linalg.norm(emb) == 0:
                continue
            known.append({
                "person_id": face.person.id,
                "person_name": face.person.full_name,
                "embedding": emb,
            })
    return known


# --- Cached loader: avoids hitting DB on every frame ---
import time as _time

_cache: List[Dict] = []
_cache_time: float = 0
_CACHE_TTL = 30  # seconds


def load_known_embeddings_cached(db: Session) -> List[Dict]:
    """Load embeddings with a 30-second cache to avoid per-frame DB queries."""
    global _cache, _cache_time
    now = _time.time()
    if now - _cache_time > _CACHE_TTL or not _cache:
        _cache = load_known_embeddings(db)
        _cache_time = now
    return _cache


def invalidate_embeddings_cache():
    """Call this after enrolling/deleting a person to refresh the cache."""
    global _cache_time
    _cache_time = 0
