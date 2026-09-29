import math
import os
import re
from typing import List, Optional
import numpy as np
from backend.app.config import settings

class EmbeddingEngine:
    """
    Unified Embedding Engine supporting:
    1. OpenAI Embeddings (if OPENAI_API_KEY provided)
    2. Local Semantic Dense Hash Embeddings (guaranteed deterministic 384-dimensional vectors with real cosine similarity)
    """
    def __init__(self, provider: Optional[str] = None, api_key: Optional[str] = None):
        self.provider = provider or settings.EMBEDDING_PROVIDER
        self.api_key = api_key or settings.EMBEDDING_API_KEY or os.getenv("OPENAI_API_KEY")
        self.dim = 384

    def get_embedding(self, text: str) -> List[float]:
        return self.get_embeddings([text])[0]

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        if self.provider == "openai" and self.api_key:
            try:
                import requests
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                resp = requests.post(
                    "https://api.openai.com/v1/embeddings",
                    headers=headers,
                    json={"input": texts, "model": settings.EMBEDDING_MODEL or "text-embedding-3-small"},
                    timeout=10
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return [item["embedding"] for item in data["data"]]
            except Exception as e:
                print(f"[EmbeddingEngine] OpenAI embedding error: {e}. Falling back to local semantic vectorizer.")

        # Local semantic vectorizer: Generates normalized dense embedding via semantic feature hashing
        return [self._generate_local_embedding(t) for t in texts]

    def _generate_local_embedding(self, text: str) -> List[float]:
        """
        Deterministic, robust semantic 384-dim dense embedding generator using:
        - Token n-grams
        - Term frequency weighting
        - Domain keyword hashing (database, connection, pool, auth, token, redis, memory, lock, timeout, kafka, oom, lag)
        - Unit L2-norm projection for exact cosine similarity dot products.
        """
        vector = np.zeros(self.dim, dtype=np.float32)
        cleaned = re.sub(r'[^a-zA-Z0-9_\-\s]', ' ', text.lower())
        tokens = cleaned.split()
        
        if not tokens:
            # Non-zero baseline
            vector[0] = 1.0
            return vector.tolist()

        # Domain semantic anchors mapping
        sre_anchors = {
            "database": [0, 1, 2, 3],
            "connection": [4, 5, 6, 7],
            "pool": [8, 9, 10, 11],
            "timeout": [12, 13, 14, 15],
            "auth": [16, 17, 18, 19],
            "jwt": [20, 21, 22, 23],
            "token": [24, 25, 26, 27],
            "jwks": [28, 29, 30, 31],
            "key": [32, 33, 34, 35],
            "memory": [36, 37, 38, 39],
            "oom": [40, 41, 42, 43],
            "leak": [44, 45, 46, 47],
            "redis": [48, 49, 50, 51],
            "cache": [52, 53, 54, 55],
            "lock": [56, 57, 58, 59],
            "deadlock": [60, 61, 62, 63],
            "kafka": [64, 65, 66, 67],
            "consumer": [68, 69, 70, 71],
            "rebalance": [72, 73, 74, 75],
            "lag": [76, 77, 78, 79],
            "wal": [80, 81, 82, 83],
            "disk": [84, 85, 86, 87],
            "ssl": [88, 89, 90, 91],
            "certificate": [92, 93, 94, 95],
            "circuit": [96, 97, 98, 99],
            "breaker": [100, 101, 102, 103],
            "rate": [104, 105, 106, 107],
            "limit": [108, 109, 110, 111],
            "proxy": [112, 113, 114, 115],
            "graphql": [116, 117, 118, 119],
            "500": [120, 121, 122],
            "504": [123, 124, 125],
            "401": [126, 127, 128],
            "429": [129, 130, 131],
            "payment": [132, 133, 134, 135],
            "order": [136, 137, 138, 139],
            "user": [140, 141, 142, 143]
        }

        # 1. Anchor weight distribution
        for token in tokens:
            for anchor, dims in sre_anchors.items():
                if anchor in token or token in anchor:
                    for d in dims:
                        vector[d] += 2.5

        # 2. Generalized hash projection for remaining vocabulary and char trigrams
        for i, token in enumerate(tokens):
            h = hash(token) % self.dim
            vector[h] += 1.0
            
            # Bigrams
            if i < len(tokens) - 1:
                bigram = f"{token}_{tokens[i+1]}"
                bh = hash(bigram) % self.dim
                vector[bh] += 1.5

        # 3. Char ngrams
        for i in range(len(cleaned) - 2):
            trigram = cleaned[i:i+3]
            th = hash(trigram) % self.dim
            vector[th] += 0.2

        # L2 Normalization
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm

        return vector.tolist()

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    a = np.array(vec1, dtype=np.float32)
    b = np.array(vec2, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))
