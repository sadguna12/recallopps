import json
import os
import requests
from typing import Dict, Any, Optional
from backend.app.llm.base import BaseLLMProvider, LLMResponse
from backend.app.config import settings

class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.LLM_API_KEY or os.getenv("OPENAI_API_KEY")
        self.model = model or settings.LLM_MODEL or "gpt-4o"

    def generate_response(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> LLMResponse:
        if not self.api_key:
            raise ValueError("OpenAI API key is missing. Configure LLM_API_KEY in settings or environment.")
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": temperature
        }
        resp = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        return LLMResponse(content=content, raw_data=data)

    def generate_json_response(self, system_prompt: str, user_prompt: str, temperature: float = 0.1) -> Dict[str, Any]:
        response = self.generate_response(
            system_prompt=system_prompt + "\n\nCRITICAL: Respond ONLY with a valid raw JSON object conforming to the required schema. No markdown backticks, no markdown formatting.",
            user_prompt=user_prompt,
            temperature=temperature
        )
        content = response.content.strip()
        # Clean markdown codeblocks if LLM returned them
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        return json.loads(content.strip())
