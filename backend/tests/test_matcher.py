"""Tests for the face matching service."""

import numpy as np
import pytest
from app.services.matcher import cosine_similarity, match_embedding, top_k_vote


class TestCosineSimilarity:
    def test_identical_vectors(self):
        v = np.array([1.0, 2.0, 3.0])
        assert cosine_similarity(v, v) == pytest.approx(1.0)

    def test_orthogonal_vectors(self):
        a = np.array([1.0, 0.0])
        b = np.array([0.0, 1.0])
        assert cosine_similarity(a, b) == pytest.approx(0.0)

    def test_opposite_vectors(self):
        a = np.array([1.0, 0.0])
        b = np.array([-1.0, 0.0])
        assert cosine_similarity(a, b) == pytest.approx(-1.0)

    def test_zero_vector_returns_zero(self):
        a = np.zeros(3)
        b = np.array([1.0, 2.0, 3.0])
        assert cosine_similarity(a, b) == 0.0


class TestMatchEmbedding:
    def setup_method(self):
        self.known = [
            {"person_id": 1, "person_name": "Alice", "embedding": [1.0, 0.0, 0.0]},
            {"person_id": 2, "person_name": "Bob", "embedding": [0.0, 1.0, 0.0]},
        ]

    def test_match_found(self):
        query = np.array([0.9, 0.1, 0.0])
        result = match_embedding(query, self.known, threshold=0.5)
        assert result is not None
        assert result["person_id"] == 1
        assert result["person_name"] == "Alice"
        assert result["similarity"] > 0.5

    def test_no_match_below_threshold(self):
        query = np.array([0.5, 0.5, 0.7])
        result = match_embedding(query, self.known, threshold=0.99)
        assert result is None

    def test_empty_known_returns_none(self):
        query = np.array([1.0, 0.0, 0.0])
        assert match_embedding(query, [], threshold=0.5) is None


class TestTopKVote:
    def test_vote_with_multiple_embeddings(self):
        known = [
            {"person_id": 1, "person_name": "Alice", "embedding": [1.0, 0.0, 0.0]},
            {"person_id": 1, "person_name": "Alice", "embedding": [0.95, 0.05, 0.0]},
            {"person_id": 2, "person_name": "Bob", "embedding": [0.0, 1.0, 0.0]},
        ]
        query = np.array([0.9, 0.1, 0.0])
        result = top_k_vote(query, known, k=3, threshold=0.3)
        assert result is not None
        assert result["person_id"] == 1

    def test_no_vote_below_threshold(self):
        known = [
            {"person_id": 1, "person_name": "Alice", "embedding": [1.0, 0.0, 0.0]},
        ]
        query = np.array([0.0, 0.0, 1.0])
        result = top_k_vote(query, known, k=3, threshold=0.9)
        assert result is None
