from pydantic import BaseModel
from datetime import datetime
from typing import Literal
from uuid import uuid4


class ApprovalRequest(BaseModel):
    id: str = uuid4().hex[:12]
    session_id: str
    tool_call_id: str
    tool_name: str
    arguments: dict
    risk_level: Literal["read", "write"] = "write"
    diff_preview: dict | None = None
    created_at: datetime = datetime.now()
    expires_at: datetime | None = None


class ApprovalResponse(BaseModel):
    approved: bool
