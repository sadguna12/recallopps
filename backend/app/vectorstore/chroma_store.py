import os
import shutil
from typing import List, Dict, Any, Optional
from backend.app.config import settings
from backend.app.vectorstore.base import BaseVectorStore, VectorSearchResult
from backend.app.rag.embeddings import EmbeddingEngine, cosine_similarity

class ChromaVectorStore(BaseVectorStore):
    def __init__(self, persist_dir: Optional[str] = None):
        self.persist_dir = persist_dir or settings.CHROMA_PERSIST_DIR
        self.embedding_engine = EmbeddingEngine()
        self.client = None
        self._collections: Dict[str, Any] = {}
        self._fallback_memory_store: Dict[str, List[Dict[str, Any]]] = {
            "incidents": [],
            "runbooks": [],
            "postmortems": [],
            "learned_memories": []
        }
        self._init_chroma()

    def _init_chroma(self):
        try:
            import chromadb
            from chromadb.config import Settings as ChromaSettings
            
            os.makedirs(self.persist_dir, exist_ok=True)
            self.client = chromadb.PersistentClient(path=self.persist_dir)
            
            # Ensure collections exist
            for col_name in ["incidents", "runbooks", "postmortems", "learned_memories"]:
                self._collections[col_name] = self.client.get_or_create_collection(
                    name=col_name,
                    metadata={"hnsw:space": "cosine"}
                )
            print(f"[ChromaVectorStore] Successfully connected to ChromaDB at {self.persist_dir}")
        except Exception as e:
            print(f"[ChromaVectorStore] Notice: ChromaDB native persistent client initialization: {e}. Using resilient in-memory vector store with exact cosine similarity.")
            self.client = None

    def add_documents(
        self,
        collection_name: str,
        ids: List[str],
        documents: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        embeddings: Optional[List[List[float]]] = None
    ) -> None:
        if not ids:
            return

        if metadatas is None:
            metadatas = [{} for _ in ids]

        # Calculate embeddings if not provided
        if embeddings is None:
            embeddings = self.embedding_engine.get_embeddings(documents)

        # Store in ChromaDB if client available
        if self.client and collection_name in self._collections:
            try:
                col = self._collections[collection_name]
                # ChromaDB metadata values must not be None
                clean_metadatas = []
                for m in metadatas:
                    clean_m = {k: ("" if v is None else str(v) if not isinstance(v, (int, float, bool, str)) else v) for k, v in m.items()}
                    clean_metadatas.append(clean_m)
                    
                col.upsert(
                    ids=ids,
                    documents=documents,
                    metadatas=clean_metadatas,
                    embeddings=embeddings
                )
            except Exception as e:
                print(f"[ChromaVectorStore] Upsert warning: {e}")

        # Always maintain backup memory store for zero-latency retrieval
        if collection_name not in self._fallback_memory_store:
            self._fallback_memory_store[collection_name] = []

        # Remove existing IDs if any
        id_set = set(ids)
        self._fallback_memory_store[collection_name] = [
            item for item in self._fallback_memory_store[collection_name] if item["id"] not in id_set
        ]

        for i, doc_id in enumerate(ids):
            self._fallback_memory_store[collection_name].append({
                "id": doc_id,
                "document": documents[i],
                "metadata": metadatas[i],
                "embedding": embeddings[i]
            })

    def search(
        self,
        collection_name: str,
        query: str,
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None,
        query_embedding: Optional[List[float]] = None
    ) -> List[VectorSearchResult]:
        if query_embedding is None:
            query_embedding = self.embedding_engine.get_embedding(query)

        # Try ChromaDB query first
        if self.client and collection_name in self._collections:
            try:
                col = self._collections[collection_name]
                chroma_results = col.query(
                    query_embeddings=[query_embedding],
                    n_results=min(top_k, max(col.count(), 1)),
                    where=filter_metadata if filter_metadata else None
                )
                
                results = []
                if chroma_results and chroma_results["ids"] and chroma_results["ids"][0]:
                    ids = chroma_results["ids"][0]
                    docs = chroma_results["documents"][0]
                    metas = chroma_results["metadatas"][0] if chroma_results.get("metadatas") else [{}] * len(ids)
                    distances = chroma_results["distances"][0] if chroma_results.get("distances") else [0.0] * len(ids)
                    
                    for doc_id, doc, meta, dist in zip(ids, docs, metas, distances):
                        # For cosine distance, similarity = 1 - (dist / 2) or 1 - dist
                        similarity = max(0.0, min(1.0, 1.0 - (dist if dist <= 1.0 else dist / 2.0)))
                        results.append(VectorSearchResult(
                            id=doc_id,
                            document=doc,
                            metadata=meta,
                            score=similarity
                        ))
                    
                    if results:
                        results.sort(key=lambda r: r.score, reverse=True)
                        return results[:top_k]
            except Exception as e:
                print(f"[ChromaVectorStore] Search warning: {e}. Falling back to cosine search.")

        # Fallback exact cosine search
        items = self._fallback_memory_store.get(collection_name, [])
        scored_results = []
        for item in items:
            # Metadata filter if provided
            if filter_metadata:
                match = True
                for k, v in filter_metadata.items():
                    if item["metadata"].get(k) != v:
                        match = False
                        break
                if not match:
                    continue

            sim = cosine_similarity(query_embedding, item["embedding"])
            # Format normalized similarity score
            scored_results.append(VectorSearchResult(
                id=item["id"],
                document=item["document"],
                metadata=item["metadata"],
                score=sim
            ))

        scored_results.sort(key=lambda r: r.score, reverse=True)
        return scored_results[:top_k]

    def delete(self, collection_name: str, id: str) -> None:
        if self.client and collection_name in self._collections:
            try:
                self._collections[collection_name].delete(ids=[id])
            except Exception:
                pass
        
        if collection_name in self._fallback_memory_store:
            self._fallback_memory_store[collection_name] = [
                item for item in self._fallback_memory_store[collection_name] if item["id"] != id
            ]

    def count(self, collection_name: str) -> int:
        if self.client and collection_name in self._collections:
            try:
                return self._collections[collection_name].count()
            except Exception:
                pass
        return len(self._fallback_memory_store.get(collection_name, []))

    def reset(self) -> None:
        if self.client:
            try:
                for col_name in list(self._collections.keys()):
                    self.client.delete_collection(col_name)
                    self._collections[col_name] = self.client.create_collection(
                        name=col_name,
                        metadata={"hnsw:space": "cosine"}
                    )
            except Exception:
                pass
        
        for k in self._fallback_memory_store:
            self._fallback_memory_store[k] = []

# Singleton instance
vector_store = ChromaVectorStore()
