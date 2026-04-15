import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

import structlog

logger = structlog.get_logger()


class AuditLogger:
    def __init__(self, log_dir: str = "audit_logs"):
        self._log_dir = Path(log_dir)
        self._log_dir.mkdir(parents=True, exist_ok=True)

    def log(self, session_id: str, event_type: str, data: dict[str, Any]) -> None:
        entry = {
            "timestamp": datetime.now().isoformat(),
            "session_id": session_id,
            "event_type": event_type,
            "data": data,
        }
        log_file = self._log_dir / f"{session_id}.jsonl"
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        logger.info("audit_log", session_id=session_id, event_type=event_type)

    def log_user_message(self, session_id: str, content: str) -> None:
        self.log(session_id, "user_message", {"content": content})

    def log_assistant_response(self, session_id: str, content: str) -> None:
        self.log(session_id, "assistant_response", {"content": content})

    def log_tool_call(self, session_id: str, tool_name: str, arguments: dict, result: Any = None) -> None:
        self.log(session_id, "tool_call", {"tool": tool_name, "arguments": arguments, "result": result})

    def log_tool_rejected(self, session_id: str, tool_name: str, arguments: dict) -> None:
        self.log(session_id, "tool_rejected", {"tool": tool_name, "arguments": arguments})

    def log_approval(self, session_id: str, approval_id: str, approved: bool) -> None:
        self.log(session_id, "approval", {"approval_id": approval_id, "approved": approved})

    def log_mcp_connected(self, session_id: str, pid: int | None = None) -> None:
        self.log(session_id, "mcp_connected", {"pid": pid})

    def log_mcp_disconnected(self, session_id: str) -> None:
        self.log(session_id, "mcp_disconnected", {})

    def log_error(self, session_id: str, error: str, context: dict | None = None) -> None:
        self.log(session_id, "error", {"error": error, **(context or {})})
