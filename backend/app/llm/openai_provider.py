import json
import logging
from typing import AsyncIterator

from openai import AsyncOpenAI

from app.config import settings
from app.llm.base import LLMProvider, LLMResponse, ToolCall

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = (
    "You are an AI assistant specialized in Power BI semantic modeling. "
    "You have access to Power BI Modeling MCP tools that let you interact with Power BI models. "
    "When the user asks about tables, measures, columns, relationships, or DAX queries, "
    "use the available MCP tools to retrieve real data and provide accurate answers. "
    "Always explain what you are doing before making tool calls. "
    "When creating or modifying measures, always show the DAX expression clearly."
)


class OpenAIProvider(LLMProvider):
    def __init__(self):
        self._client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def chat(
        self,
        messages: list[dict],
        tools: list[dict] | None = None,
        model: str | None = None,
    ) -> LLMResponse:
        model = model or settings.default_model
        kwargs = self._build_kwargs(messages, tools, model, stream=False)
        response = await self._client.chat.completions.create(**kwargs)

        choice = response.choices[0]
        content = choice.message.content or ""
        tool_calls = self._parse_tool_calls(choice.message.tool_calls)
        finish_reason = choice.finish_reason or ""

        return LLMResponse(content=content, tool_calls=tool_calls, finish_reason=finish_reason)

    async def chat_stream(
        self,
        messages: list[dict],
        tools: list[dict] | None = None,
        model: str | None = None,
    ) -> AsyncIterator[dict]:
        model = model or settings.default_model
        kwargs = self._build_kwargs(messages, tools, model, stream=True)
        stream = await self._client.chat.completions.create(**kwargs)

        current_tool_calls: dict[int, dict] = {}

        async for chunk in stream:
            if not chunk.choices:
                continue

            delta = chunk.choices[0].delta

            if delta.content:
                yield {"type": "content", "content": delta.content}

            if delta.tool_calls:
                for tc_delta in delta.tool_calls:
                    idx = tc_delta.index
                    if idx not in current_tool_calls:
                        current_tool_calls[idx] = {"id": "", "name": "", "arguments": ""}
                    current = current_tool_calls[idx]
                    if tc_delta.id:
                        current["id"] = tc_delta.id
                    if tc_delta.function:
                        if tc_delta.function.name:
                            current["name"] += tc_delta.function.name
                        if tc_delta.function.arguments:
                            current["arguments"] += tc_delta.function.arguments

            if chunk.choices[0].finish_reason == "tool_calls":
                for idx in sorted(current_tool_calls):
                    tc = current_tool_calls[idx]
                    try:
                        args = json.loads(tc["arguments"]) if tc["arguments"] else {}
                    except json.JSONDecodeError:
                        args = {}
                    yield {
                        "type": "tool_call",
                        "id": tc["id"],
                        "name": tc["name"],
                        "arguments": args,
                    }
                current_tool_calls.clear()

            if chunk.choices[0].finish_reason == "stop":
                return

    def _build_kwargs(self, messages: list[dict], tools: list[dict] | None, model: str, stream: bool) -> dict:
        full_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages
        kwargs: dict = {"model": model, "messages": full_messages, "stream": stream}
        if tools:
            kwargs["tools"] = self._convert_tools(tools)
            kwargs["tool_choice"] = "auto"
        return kwargs

    def _convert_tools(self, mcp_tools: list[dict]) -> list[dict]:
        openai_tools = []
        for t in mcp_tools:
            openai_tools.append(
                {
                    "type": "function",
                    "function": {
                        "name": t["name"],
                        "description": t.get("description", ""),
                        "parameters": t.get("input_schema", t.get("parameters", {})),
                    },
                }
            )
        return openai_tools

    def _parse_tool_calls(self, raw_tool_calls) -> list[ToolCall]:
        if not raw_tool_calls:
            return []
        result = []
        for tc in raw_tool_calls:
            try:
                args = json.loads(tc.function.arguments) if tc.function.arguments else {}
            except json.JSONDecodeError:
                args = {}
            result.append(ToolCall(id=tc.id, name=tc.function.name, arguments=args))
        return result
