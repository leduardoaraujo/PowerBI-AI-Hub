import logging
from typing import Any

from app.core.mcp_bridge import MCPBridge
from app.core.mcp_downloader import MCPDownloader
from app.models.mcp import MCPStatus, MCPToolInfo, MCPDownloadResult
from app.core.tool_parser import enrich_tool_info
import platform as plat

logger = logging.getLogger(__name__)


class MCPService:
    def __init__(self, mcp_bridge: MCPBridge, downloader: MCPDownloader):
        self._bridge = mcp_bridge
        self._downloader = downloader

    async def start(self, mode: str | None = None) -> MCPStatus:
        await self._bridge.start(mode=mode)
        return self.get_status()

    async def stop(self) -> None:
        await self._bridge.stop()

    def get_status(self) -> MCPStatus:
        return MCPStatus(
            connected=self._bridge.is_connected,
            pid=self._bridge.pid,
            mode=self._bridge.mode,
            uptime_seconds=self._bridge.uptime_seconds,
        )

    def get_tools(self) -> list[MCPToolInfo]:
        raw_tools = self._bridge.get_tools()
        result = []
        for t in raw_tools:
            enriched = enrich_tool_info(t)
            result.append(
                MCPToolInfo(
                    name=enriched.get("name", ""),
                    description=enriched.get("description", ""),
                    input_schema=enriched.get("inputSchema", enriched.get("input_schema", {})),
                    classification=enriched.get("classification", "read"),
                )
            )
        return result

    async def call_tool(self, name: str, arguments: dict[str, Any]) -> dict:
        return await self._bridge.call_tool(name, arguments)

    async def download(self, version: str | None = None, platform_str: str | None = None) -> MCPDownloadResult:
        dest_dir = await self._downloader.download(version=version, target_platform=platform_str)
        exe_name = "powerbi-modeling-mcp.exe" if plat.system() == "Windows" else "powerbi-modeling-mcp"
        exe_path = next(dest_dir.rglob(exe_name), None)
        version_str = version or "latest"
        return MCPDownloadResult(
            status="downloaded",
            version=version_str,
            path=str(exe_path) if exe_path else str(dest_dir),
        )

    async def get_available_versions(self) -> list[str]:
        return await self._downloader.get_available_versions()

    async def get_installed_version(self) -> str | None:
        return await self._downloader.get_installed_version()
