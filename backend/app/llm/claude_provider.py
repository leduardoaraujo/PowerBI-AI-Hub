import json
import logging
from typing import AsyncIterator

import anthropic

from app.config import settings
from app.llm.base import LLMProvider, LLMResponse, ToolCall

logger = logging.getLogger(__name__)


CLAUDE_SYSTEM_PROMPT = (
    "You are an AI assistant specialized in Power BI semantic modeling. "
    "You have access to Power BI Modeling MCP tools that let you interact with Power BI models. "
    "When the user asks about tables, measures, columns, relationships, or DAX queries, "
    "use the available MCP tools to retrieve real data and provide accurate answers. "
    "Always explain what you are doing before making tool calls. "
    "When creating or modifying measures, always show the DAX expression clearly."
)


class ClaudeProvider(LLMProvider):
    def __init__(self):
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def chat(
        self,
        messages: list[dict],
        tools: list[dict] | None = None,
        model: str | None = None,
    ) -> LLMResponse:
        model = model or "claude-sonnet-4-20250514"
        kwargs = self._build_kwargs(messages, tools, model)
        response = await self._client.messages.create(**kwargs)

        content = ""
        tool_calls = []
        for block in response.content:
            if block.type == "text":
                content += block.text
            elif block.type == "tool_use":
                tool_calls.append(ToolCall(id=block.id, name=block.name, arguments=dict(block.input)))

        return LLMResponse(content=content, tool_calls=tool_calls, finish_reason=response.stop_reason or "")

    async def chat_stream(
        self,
        messages: list[dict],
        tools: list[dict] | None = None,
        model: str | None = None,
    ) -> AsyncIterator[dict]:
        model = model or "claude-sonnet-4-20250514"
        kwargs = self._build_kwargs(messages, tools, model)
        async with self._client.messages.stream(**kwargs) as stream:
            current_tool: dict = {}
            async for event in stream:
                if event.type == "content_block_delta":
                    if event.delta.type == "text_delta":
                        yield {"type": "content", "content": event.delta.text}
                elif event.type == "tool_use_start":
                    current_tool = {
                        "id": event.id if hasattr(event, "id") else "",
                        "name": event.name if hasattr(event, "name") else "",
                    }
                elif event.type == "tool_use_end":
                    pass

            message = await stream.get_final_message()
            for block in message.content:
                if block.type == "tool_use":
                    yield {
                        "type": "tool_call",
                        "id": block.id,
                        "name": block.name,
                        "arguments": dict(block.input),
                    }

    def _build_kwargs(self, messages: list[dict], tools: list[dict] | None, model: str) -> dict:
        filtered = [m for m in messages if m["role"] != "system"]
        kwargs: dict = {
            "model": model,
            "max_tokens": 4096,
            "system": CLAUDE_SYSTEM_PROMPT,
            "messages": filtered,
        }
        if tools:
            kwargs["tools"] = self._convert_tools(tools)
        return kwargs

    def _convert_tools(self, mcp_tools: list[dict]) -> list[dict]:
        claude_tools = []
        for t in mcp_tools:
            claude_tools.append(
                {
                    "name": t["name"],
                    "description": t.get("description", ""),
                    "input_schema": t.get("input_schema", t.get("parameters", {"type": "object", "properties": {}})),
                }
            )
        return claude_tools
