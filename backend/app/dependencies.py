from app.core.mcp_bridge import MCPBridge
from app.core.mcp_downloader import MCPDownloader
from app.core.audit_logger import AuditLogger
from app.services.chat_service import ChatService
from app.services.mcp_service import MCPService
from app.services.session_service import SessionService
from app.config import settings

_mcp_bridge: MCPBridge | None = None
_mcp_service: MCPService | None = None
_session_service: SessionService | None = None
_chat_service: ChatService | None = None
_audit_logger: AuditLogger | None = None


def _get_mcp_bridge() -> MCPBridge:
    global _mcp_bridge
    if _mcp_bridge is None:
        _mcp_bridge = MCPBridge()
    return _mcp_bridge


def _get_audit_logger() -> AuditLogger:
    global _audit_logger
    if _audit_logger is None:
        _audit_logger = AuditLogger(log_dir=settings.audit_log_dir)
    return _audit_logger


def get_session_service() -> SessionService:
    global _session_service
    if _session_service is None:
        _session_service = SessionService()
    return _session_service


def get_mcp_service() -> MCPService:
    global _mcp_service
    if _mcp_service is None:
        _mcp_service = MCPService(_get_mcp_bridge(), MCPDownloader())
    return _mcp_service


def get_chat_service() -> ChatService:
    global _chat_service
    if _chat_service is None:
        _chat_service = ChatService(_get_mcp_bridge(), _get_audit_logger())
    return _chat_service
