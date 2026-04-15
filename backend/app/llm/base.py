from abc import ABC, abstractmethod
from typing import AsyncIterator
from dataclasses import dataclass, field
from enum import Literal


@dataclass
class ToolCall:
    id: str
    name: str
    arguments: dict
    classification: Literal["read", "write"] = "read"


@dataclass
class LLMResponse:
    content: str
    tool_calls: list[ToolCall] = field(default_factory=list)
    finish_reason: str = ""


class LLMProvider(ABC):
    @abstractmethod
    async def chat(
        self,
        messages: list[dict],
        tools: list[dict] | None = None,
        model: str | None = None,
    ) -> LLMResponse:
        """Send messages and return a complete response."""

    @abstractmethod
    async def chat_stream(
        self,
        messages: list[dict],
        tools: list[dict] | None = None,
        model: str | None = None,
    ) -> AsyncIterator[dict]:
        """Yield streaming events: {type: 'content'|'tool_call', ...}."""
