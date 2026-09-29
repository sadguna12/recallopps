from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class VectorSearchResult:
    def __init__(self, id: str, document: str, metadata: Dict[str, Any], score: float):
        self.id = id
        self.document = document
        self.metadata = metadata
        self.score = score # Normalised similarity score 0.0 to 1.0 (1.0 = identical)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "document": self.document,
            "metadata": self.metadata,
            "similarity_score": round(self.score, 4)
        }

class BaseVectorStore(ABC):
    @abstractmethod
    def add_documents(
        self,
        collection_name: str,
        ids: List[str],
        documents: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        embeddings: Optional[List[List[float]]] = None
    ) -> None:
        pass

    @abstractmethod
    def search(
        self,
        collection_name: str,
        query: str,
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None,
        query_embedding: Optional[List[float]] = None
    ) -> List[VectorSearchResult]:
        pass

    @abstractmethod
    def delete(self, collection_name: str, id: str) -> None:
        pass

    @abstractmethod
    def count(self, collection_name: str) -> int:
        pass

    @abstractmethod
    def reset(self) -> None:
        pass
