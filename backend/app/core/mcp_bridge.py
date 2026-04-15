import asyncio
import logging
import platform
from datetime import datetime
from pathlib import Path

from app.config import settings
from app.core.mcp_client import MCPClient

logger = logging.getLogger(__name__)

WRITE_OPERATIONS: dict[str, set[str]] = {
    "measure_operations": {"create", "update", "delete", "rename", "move"},
    "table_operations": {"create", "update", "delete", "rename"},
    "column_operations": {"create", "update", "delete", "rename"},
    "relationship_operations": {"create", "update", "delete", "activate", "deactivate"},
    "partition_operations": {"create", "update", "delete", "refresh"},
    "calculation_group_operations": {"create", "update", "delete"},
    "security_role_operations": {"create", "update", "delete"},
    "perspective_operations": {"create", "update", "delete"},
    "named_expression_operations": {"create", "update", "delete"},
    "function_operations": {"create", "update", "delete"},
    "culture_operations": {"create", "update", "delete"},
    "object_translation_operations": {"create", "update", "delete"},
    "calendar_operations": {"create", "update", "delete"},
    "query_group_operations": {"create", "update", "delete"},
    "user_hierarchy_operations": {"create", "update", "delete"},
    "database_operations": {"update", "create", "deploy"},
    "transaction_operations": {"begin", "commit", "rollback"},
}

WRITE_ONLY_TOOLS = set()


class MCPBridge:
    def __init__(self):
        self._client: MCPClient | None = None
        self._mode: str = settings.mcp_default_mode
        self._tools: list[dict] = []
        self._start_time: datetime | None = None
        self._version: str | None = None
        self._restart_count: int = 0

    @property
    def is_connected(self) -> bool:
        return self._client is not None and self._client.is_alive

    @property
    def mode(self) -> str:
        return self._mode

    @property
    def pid(self) -> int | None:
        if self._client and self._client._process:
            return self._client._process.pid
        return None

    @property
    def uptime_seconds(self) -> float | None:
        if self._start_time and self.is_connected:
            return (datetime.now() - self._start_time).total_seconds()
        return None

    async def start(self, mode: str | None = None, exe_path: str | None = None) -> None:
        if self.is_connected:
            await self.stop()

        self._mode = mode or settings.mcp_default_mode
        resolved = exe_path or settings.mcp_exe_path or await self._resolve_exe()

        cmd = [resolved, "--start"]
        if self._mode == "readonly":
            cmd.append("--readonly")

        logger.info("Starting MCP server: %s", " ".join(cmd))
        self._client = await MCPClient.connect(cmd)
        self._start_time = datetime.now()

        tools_response = await self._client.list_tools()
        self._tools = tools_response if isinstance(tools_response, list) else tools_response.get("tools", [])

        logger.info("MCP server started (pid=%s). %d tools available.", self.pid, len(self._tools))

    async def _resolve_exe(self) -> str:
        bin_dir = Path(settings.mcp_bin_dir)
        if not bin_dir.exists():
            raise FileNotFoundError(f"MCP binary directory not found: {bin_dir}")

        exe_name = "powerbi-modeling-mcp.exe" if platform.system() == "Windows" else "powerbi-modeling-mcp"
        candidates = sorted(bin_dir.rglob(exe_name), reverse=True)
        if not candidates:
            raise FileNotFoundError(f"MCP executable not found in {bin_dir}")
        return str(candidates[0])

    async def call_tool(self, name: str, arguments: dict) -> dict:
        if not self.is_connected:
            raise RuntimeError("MCP server is not connected")
        if self._mode == "readonly" and self._is_write_operation(name, arguments):
            raise PermissionError(
                f"Tool '{name}' with operation '{arguments.get('operation', '')}' "
                f"requires readwrite mode. Current mode: {self._mode}"
            )
        return await self._client.call_tool(name, arguments)

    def _is_write_operation(self, tool_name: str, arguments: dict) -> bool:
        if tool_name in WRITE_ONLY_TOOLS:
            return True
        if tool_name in WRITE_OPERATIONS:
            operation = arguments.get("operation", "").lower()
            if operation in WRITE_OPERATIONS[tool_name]:
                return True
        return False

    def get_tools(self) -> list[dict]:
        return self._tools

    async def stop(self) -> None:
        if self._client:
            logger.info("Stopping MCP server (pid=%s)", self.pid)
            await self._client.close()
            self._client = None
            self._start_time = None

    async def restart(self) -> None:
        mode = self._mode
        await self.stop()
        self._restart_count += 1
        await self.start(mode=mode)
