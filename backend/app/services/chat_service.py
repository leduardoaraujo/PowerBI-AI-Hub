import json
import logging
from typing import AsyncIterator

from app.config import settings
from app.core.mcp_bridge import MCPBridge
from app.core.tool_parser import classify_tool
from app.core.audit_logger import AuditLogger
from app.llm.factory import LLMFactory
from app.llm.base import ToolCall
from app.models.chat import ChatMessage

logger = logging.getLogger(__name__)

MAX_TOOL_ITERATIONS = 10


class ChatService:
    def __init__(self, mcp_bridge: MCPBridge, audit: AuditLogger):
        self._mcp = mcp_bridge
        self._audit = audit

    async def process_message(
        self,
        session_id: str,
        user_message: str,
        history: list[dict],
        provider: str,
        model: str,
    ) -> AsyncIterator[dict]:
        llm = LLMFactory.create(provider)
        mcp_tools = self._mcp.get_tools()
        llm_tools = self._convert_mcp_tools(mcp_tools) if mcp_tools else None

        messages = list(history) + [{"role": "user", "content": user_message}]
        self._audit.log_user_message(session_id, user_message)

        for iteration in range(MAX_TOOL_ITERATIONS):
            response = await llm.chat(messages, tools=llm_tools, model=model)

            if response.content:
                self._audit.log_assistant_response(session_id, response.content)
                yield {"type": "message", "content": response.content}

            if not response.tool_calls:
                return

            for tc in response.tool_calls:
                classification = classify_tool(tc.name, tc.arguments)
                tc.classification = classification

                yield {
                    "type": "tool_call_start",
                    "tool_call_id": tc.id,
                    "tool_name": tc.name,
                    "arguments": tc.arguments,
                    "classification": classification,
                }

                if classification == "write" and self._mcp.mode == "readonly":
                    error_msg = f"Tool '{tc.name}' requires readwrite mode. Current mode: {self._mcp.mode}"
                    self._audit.log_error(session_id, error_msg, {"tool": tc.name})
                    yield {
                        "type": "tool_call_error",
                        "tool_call_id": tc.id,
                        "error": error_msg,
                    }
                    messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": tc.id,
                            "content": json.dumps({"error": error_msg}),
                        }
                    )
                    continue

                try:
                    result = await self._mcp.call_tool(tc.name, tc.arguments)
                    self._audit.log_tool_call(session_id, tc.name, tc.arguments, result)
                    result_str = json.dumps(result) if isinstance(result, dict) else str(result)
                    yield {
                        "type": "tool_call_end",
                        "tool_call_id": tc.id,
                        "result": result,
                    }
                except PermissionError as e:
                    self._audit.log_error(session_id, str(e), {"tool": tc.name})
                    result_str = json.dumps({"error": str(e)})
                    yield {
                        "type": "tool_call_error",
                        "tool_call_id": tc.id,
                        "error": str(e),
                    }
                except Exception as e:
                    logger.exception("Error calling tool %s", tc.name)
                    result_str = json.dumps({"error": str(e)})
                    yield {
                        "type": "tool_call_error",
                        "tool_call_id": tc.id,
                        "error": str(e),
                    }

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc.id if provider == "openai" else tc.id,
                        "content": result_str,
                    }
                )

        yield {"type": "message", "content": "Reached maximum number of tool iterations."}

    def _convert_mcp_tools(self, mcp_tools: list[dict]) -> list[dict]:
        converted = []
        for t in mcp_tools:
            schema = t.get("inputSchema", t.get("input_schema", {}))
            if "properties" not in schema:
                schema = {"type": "object", "properties": {}}
            converted.append(
                {
                    "name": t["name"],
                    "description": t.get("description", ""),
                    "input_schema": schema,
                }
            )
        return converted
