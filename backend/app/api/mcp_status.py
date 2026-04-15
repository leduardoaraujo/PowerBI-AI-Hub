from fastapi import APIRouter, Depends
from app.models.mcp import MCPStatus, MCPToolInfo, MCPDownloadRequest, MCPDownloadResult
from app.services.mcp_service import MCPService
from app.dependencies import get_mcp_service

router = APIRouter()


@router.get("/status")
async def get_status(mcp_service: MCPService = Depends(get_mcp_service)):
    return mcp_service.get_status().model_dump()


@router.post("/start")
async def start_mcp(
    mode: str = "readonly",
    mcp_service: MCPService = Depends(get_mcp_service),
):
    status = await mcp_service.start(mode=mode)
    return status.model_dump()


@router.post("/stop")
async def stop_mcp(
    mcp_service: MCPService = Depends(get_mcp_service),
):
    await mcp_service.stop()
    return {"status": "stopped"}


@router.get("/tools")
async def list_tools(
    mcp_service: MCPService = Depends(get_mcp_service),
):
    tools = mcp_service.get_tools()
    return [t.model_dump() for t in tools]


@router.post("/download")
async def download_mcp(
    request: MCPDownloadRequest,
    mcp_service: MCPService = Depends(get_mcp_service),
):
    result = await mcp_service.download(version=request.version, platform_str=request.platform)
    return result.model_dump()


@router.get("/versions")
async def get_versions(
    mcp_service: MCPService = Depends(get_mcp_service),
):
    available = await mcp_service.get_available_versions()
    installed = await mcp_service.get_installed_version()
    return {"available": available, "installed": installed}
