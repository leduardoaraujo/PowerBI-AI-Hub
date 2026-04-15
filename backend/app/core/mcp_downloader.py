import asyncio
import json
import logging
import platform
import shutil
import zipfile
from pathlib import Path

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

PLATFORM_MAP: dict[tuple[str, str], str] = {
    ("Windows", "AMD64"): "win32-x64",
    ("Windows", "ARM64"): "win32-arm64",
    ("Linux", "x86_64"): "linux-x64",
    ("Linux", "aarch64"): "linux-arm64",
    ("Darwin", "arm64"): "darwin-arm64",
}

NPM_REGISTRY_URL = "https://registry.npmjs.org"


class MCPDownloader:
    def __init__(self):
        self._base_url = settings.download_base_url
        self._bin_dir = Path(settings.mcp_bin_dir)

    def _detect_platform(self) -> str:
        key = (platform.system(), platform.machine())
        if key not in PLATFORM_MAP:
            raise RuntimeError(f"Unsupported platform: {key}")
        return PLATFORM_MAP[key]

    async def get_latest_version(self) -> str:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery",
                json={
                    "filters": [{"criteria": [{"filterType": 7, "value": "analysis-services.powerbi-modeling-mcp"}]}],
                    "assetTypes": ["Microsoft.VisualStudio.Services.VSIXPackage"],
                },
                headers={"Accept": "application/json;api-version=6.1-preview.1"},
            )
            resp.raise_for_status()
            data = resp.json()
            versions = data["results"][0]["extensions"][0]["versions"]
            return versions[0]["version"]

    async def download(self, version: str | None = None, target_platform: str | None = None) -> Path:
        version = version or await self.get_latest_version()
        target_platform = target_platform or self._detect_platform()

        dest_dir = self._bin_dir / version / target_platform
        dest_dir.mkdir(parents=True, exist_ok=True)

        exe_name = "powerbi-modeling-mcp.exe" if platform.system() == "Windows" else "powerbi-modeling-mcp"
        exe_path = dest_dir / exe_name

        if exe_path.exists():
            logger.info("MCP executable already exists: %s", exe_path)
            return dest_dir

        vsix_url = f"{self._base_url}{version}/vspackage?targetPlatform={target_platform}"
        vsix_path = dest_dir / "extension.vsix"

        logger.info("Downloading MCP v%s for %s...", version, target_platform)
        async with httpx.AsyncClient(follow_redirects=True, timeout=120.0) as client:
            resp = await client.get(vsix_url)
            resp.raise_for_status()
            vsix_path.write_bytes(resp.content)

        logger.info("Extracting VSIX...")
        extract_dir = dest_dir / "_extracted"
        with zipfile.ZipFile(str(vsix_path), "r") as zf:
            zf.extractall(str(extract_dir))

        extracted_exes = list(extract_dir.rglob(exe_name))
        # Also look for platform-specific directories
        if not extracted_exes:
            extracted_exes = list(extract_dir.rglob("powerbi-modeling-mcp"))

        if not extracted_exes:
            raise FileNotFoundError(f"Executable not found after extraction: {exe_name}")

        shutil.copy2(str(extracted_exes[0]), str(exe_path))
        if platform.system() != "Windows":
            exe_path.chmod(0o755)

        # Cleanup
        vsix_path.unlink(missing_ok=True)
        shutil.rmtree(str(extract_dir), ignore_errors=True)

        logger.info("MCP executable ready: %s", exe_path)
        return dest_dir

    async def get_installed_version(self) -> str | None:
        if not self._bin_dir.exists():
            return None
        version_dirs = sorted(
            [d.name for d in self._bin_dir.iterdir() if d.is_dir()],
            reverse=True,
        )
        return version_dirs[0] if version_dirs else None

    async def get_available_versions(self) -> list[str]:
        try:
            latest = await self.get_latest_version()
            return [latest]
        except Exception:
            logger.warning("Could not fetch latest version from marketplace")
            return []

    def resolve_exe_path(self, version: str | None = None) -> str | None:
        if settings.mcp_exe_path:
            return settings.mcp_exe_path

        target_platform = self._detect_platform()
        search_dir = self._bin_dir
        if version:
            search_dir = search_dir / version / target_platform
        else:
            search_dir = search_dir

        exe_name = "powerbi-modeling-mcp.exe" if platform.system() == "Windows" else "powerbi-modeling-mcp"
        candidates = sorted(search_dir.rglob(exe_name), reverse=True)
        if not candidates:
            return None
        return str(candidates[0])
