from app.llm.base import LLMProvider
from app.llm.openai_provider import OpenAIProvider
from app.llm.claude_provider import ClaudeProvider


class LLMFactory:
    _providers: dict[str, type[LLMProvider]] = {
        "openai": OpenAIProvider,
        "claude": ClaudeProvider,
    }

    @classmethod
    def create(cls, provider: str) -> LLMProvider:
        provider_key = provider.lower()
        if provider_key not in cls._providers:
            raise ValueError(f"Unknown provider: {provider}. Available: {list(cls._providers.keys())}")
        return cls._providers[provider_key]()

    @classmethod
    def available_providers(cls) -> list[str]:
        return list(cls._providers.keys())
