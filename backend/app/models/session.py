from pydantic import BaseModel
from datetime import datetime
from enum import Literal
from uuid import uuid4


class Session(BaseModel):
    id: str = uuid4().hex[:12]
    provider: str = "openai"
    model: str = "gpt-4o"
    mode: Literal["readonly", "readwrite"] = "readonly"
    mcp_connected: bool = False
    created_at: datetime = datetime.now()
