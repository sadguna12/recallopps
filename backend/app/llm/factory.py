import os
from typing import Optional
from backend.app.config import settings
from backend.app.llm.base import BaseLLMProvider
from backend.app.llm.openai_provider import OpenAIProvider
from backend.app.llm.mock_sre_provider import IntelligentMockSREProvider

def get_llm_provider(
    provider_name: Optional[str] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None
) -> BaseLLMProvider:
    provider = (provider_name or settings.LLM_PROVIDER).lower()
    key = api_key or settings.LLM_API_KEY or os.getenv("LLM_API_KEY")

    if provider == "openai" and key:
        return OpenAIProvider(api_key=key, model=model or settings.LLM_MODEL)
    
    # Default: Intelligent SRE Brain (Demo Mode)
    return IntelligentMockSREProvider()
