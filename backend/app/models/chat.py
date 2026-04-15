from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal
from uuid import uuid4


class ToolCall(BaseModel):
    id: str = Field(default_factory=lambda: uuid4().hex[:12])
    name: str
    arguments: dict
    result: str | None = None
    status: Literal["pending", "running", "completed", "error"] = "pending"
    classification: Literal["read", "write"] = "read"


class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: uuid4().hex[:12])
    session_id: str
    role: Literal["user", "assistant", "system", "tool"]
    content: str
    tool_calls: list[ToolCall] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.now)


class ChatRequest(BaseModel):
    content: str
    provider: str | None = None
    model: str | None = None
