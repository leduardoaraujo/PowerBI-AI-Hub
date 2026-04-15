from fastapi import APIRouter
from .chat import router as chat_router
from .sessions import router as sessions_router
from .mcp_status import router as mcp_router

api_router = APIRouter(prefix="/api")
api_router.include_router(sessions_router, prefix="/sessions", tags=["sessions"])
api_router.include_router(chat_router, prefix="/sessions/{session_id}/messages", tags=["chat"])
api_router.include_router(mcp_router, prefix="/mcp", tags=["mcp"])
