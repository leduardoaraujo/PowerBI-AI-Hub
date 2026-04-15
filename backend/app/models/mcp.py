from pydantic import BaseModel


class MCPStatus(BaseModel):
    connected: bool
    pid: int | None = None
    version: str | None = None
    mode: str = "readonly"
    uptime_seconds: float | None = None


class MCPToolInfo(BaseModel):
    name: str
    description: str = ""
    input_schema: dict = {}
    classification: str = "read"


class MCPDownloadRequest(BaseModel):
    version: str | None = None
    platform: str | None = None


class MCPDownloadResult(BaseModel):
    status: str
    version: str
    path: str
