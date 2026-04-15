import logging
from contextlib import asynccontextmanager
import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings, validate_runtime_settings
from app.api.router import api_router
from app.dependencies import _get_mcp_bridge, get_mcp_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def _prepare_mcp_binary() -> None:
    if not settings.mcp_auto_update_on_startup:
        return

    mcp_service = get_mcp_service()
    try:
        resolved_exe = await asyncio.wait_for(
            mcp_service.ensure_latest_binary(),
            timeout=settings.mcp_auto_update_timeout_seconds,
        )
        if resolved_exe:
            settings.mcp_exe_path = resolved_exe
            logger.info("MCP executable ready at %s", resolved_exe)
    except TimeoutError:
        logger.warning(
            "Timed out while checking MCP updates after %ss",
            settings.mcp_auto_update_timeout_seconds,
        )
    except Exception:
        logger.exception("Failed to update MCP on startup; continuing with current binary")


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_runtime_settings()
    logger.info("Starting %s", settings.app_name)
    await _prepare_mcp_binary()
    bridge = _get_mcp_bridge()
    logger.info("MCP Bridge initialized (not connected yet)")
    yield
    logger.info("Shutting down %s", settings.app_name)
    if bridge.is_connected:
        await bridge.stop()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
