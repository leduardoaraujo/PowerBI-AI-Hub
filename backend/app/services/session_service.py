import logging
from datetime import datetime
from uuid import uuid4

from app.models.session import Session
from app.models.chat import ChatMessage

logger = logging.getLogger(__name__)


class SessionService:
    def __init__(self):
        self._sessions: dict[str, Session] = {}
        self._messages: dict[str, list[ChatMessage]] = {}

    def create_session(self, provider: str = "openai", model: str = "gpt-4o", mode: str = "readonly") -> Session:
        session = Session(provider=provider, model=model, mode=mode)
        self._sessions[session.id] = session
        self._messages[session.id] = []
        logger.info("Created session %s (provider=%s, model=%s, mode=%s)", session.id, provider, model, mode)
        return session

    def get_session(self, session_id: str) -> Session | None:
        return self._sessions.get(session_id)

    def list_sessions(self) -> list[Session]:
        return list(self._sessions.values())

    def delete_session(self, session_id: str) -> bool:
        if session_id in self._sessions:
            del self._sessions[session_id]
            self._messages.pop(session_id, None)
            return True
        return False

    def add_message(self, session_id: str, message: ChatMessage) -> None:
        if session_id in self._messages:
            self._messages[session_id].append(message)

    def get_messages(self, session_id: str) -> list[ChatMessage]:
        return list(self._messages.get(session_id, []))

    def get_history(self, session_id: str) -> list[dict]:
        messages = self._messages.get(session_id, [])
        result = []
        for msg in messages:
            if msg.role in ("user", "assistant"):
                result.append({"role": msg.role, "content": msg.content})
            elif msg.role == "tool":
                result.append({"role": "tool", "content": msg.content})
        return result

    def set_mcp_connected(self, session_id: str, connected: bool) -> None:
        if session_id in self._sessions:
            self._sessions[session_id].mcp_connected = connected
