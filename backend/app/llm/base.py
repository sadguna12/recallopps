from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class LLMResponse:
    def __init__(self, content: str, raw_data: Optional[Dict[str, Any]] = None):
        self.content = content
        self.raw_data = raw_data or {}

class BaseLLMProvider(ABC):
    @abstractmethod
    def generate_response(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> LLMResponse:
        pass

    @abstractmethod
    def generate_json_response(self, system_prompt: str, user_prompt: str, temperature: float = 0.1) -> Dict[str, Any]:
        pass
