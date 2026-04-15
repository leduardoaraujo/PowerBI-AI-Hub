import asyncio
import json
import logging
from typing import Any

logger = logging.getLogger(__name__)


class MCPError(Exception):
    def __init__(self, code: int, message: str, data: Any = None):
        self.code = code
        self.message = message
        self.data = data
        super().__init__(f"MCP Error {code}: {message}")


class MCPClient:
    def __init__(self, process: asyncio.subprocess.Process):
        self._process = process
        self._id_counter = 0
        self._pending: dict[int, asyncio.Future] = {}
        self._reader_task: asyncio.Task | None = None
        self._tools_cache: list[dict] | None = None
        self._initialized = False

    @classmethod
    async def connect(cls, command: list[str]) -> "MCPClient":
        process = await asyncio.create_subprocess_exec(
            *command,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        client = cls(process)
        client._reader_task = asyncio.create_task(client._read_loop())
        asyncio.create_task(client._read_stderr())
        await client.initialize()
        return client

    async def initialize(self) -> dict:
        result = await self.send_request(
            "initialize",
            {
                "protocolVersion": "2025-03-26",
                "capabilities": {
                    "roots": {"listChanged": True},
                    "elicitation": {},
                },
                "clientInfo": {"name": "powerbi-ai-hub", "version": "0.1.0"},
            },
        )
        await self.send_notification("notifications/initialized")
        self._initialized = True
        return result

    async def send_request(self, method: str, params: dict[str, Any] | None = None) -> dict:
        self._id_counter += 1
        msg_id = self._id_counter
        message: dict[str, Any] = {"jsonrpc": "2.0", "id": msg_id, "method": method}
        if params:
            message["params"] = params

        payload = json.dumps(message) + "\n"
        self._write_stdin(payload.encode())

        future: asyncio.Future = asyncio.get_event_loop().create_future()
        self._pending[msg_id] = future

        from app.config import settings

        return await asyncio.wait_for(future, timeout=settings.mcp_request_timeout)

    async def send_notification(self, method: str, params: dict[str, Any] | None = None) -> None:
        message: dict[str, Any] = {"jsonrpc": "2.0", "method": method}
        if params:
            message["params"] = params
        payload = json.dumps(message) + "\n"
        self._write_stdin(payload.encode())

    async def list_tools(self, force_refresh: bool = False) -> list[dict]:
        if self._tools_cache is not None and not force_refresh:
            return self._tools_cache
        result = await self.send_request("tools/list")
        tools = result.get("tools", [])
        self._tools_cache = tools
        return tools

    async def call_tool(self, name: str, arguments: dict[str, Any]) -> dict:
        return await self.send_request("tools/call", {"name": name, "arguments": arguments})

    async def list_resources(self) -> list[dict]:
        result = await self.send_request("resources/list")
        return result.get("resources", [])

    async def read_resource(self, uri: str) -> dict:
        return await self.send_request("resources/read", {"uri": uri})

    async def list_prompts(self) -> list[dict]:
        result = await self.send_request("prompts/list")
        return result.get("prompts", [])

    async def get_prompt(self, name: str, arguments: dict[str, Any] | None = None) -> dict:
        params: dict[str, Any] = {"name": name}
        if arguments:
            params["arguments"] = arguments
        return await self.send_request("prompts/get", params)

    def _write_stdin(self, data: bytes) -> None:
        if self._process.stdin and not self._process.stdin.is_closing():
            self._process.stdin.write(data)
            asyncio.ensure_future(self._process.stdin.drain())

    async def _read_loop(self) -> None:
        if not self._process.stdout:
            return
        while True:
            try:
                line = await self._process.stdout.readline()
            except asyncio.CancelledError:
                break
            if not line:
                break
            try:
                message = json.loads(line.decode().strip())
            except json.JSONDecodeError:
                logger.warning("Invalid JSON from MCP server: %s", line.decode(errors="replace").strip())
                continue
            self._handle_message(message)

    async def _read_stderr(self) -> None:
        if not self._process.stderr:
            return
        while True:
            try:
                line = await self._process.stderr.readline()
            except asyncio.CancelledError:
                break
            if not line:
                break
            logger.debug("MCP stderr: %s", line.decode(errors="replace").strip())

    def _handle_message(self, message: dict) -> None:
        if "id" in message:
            msg_id = message["id"]
            if msg_id in self._pending:
                future = self._pending.pop(msg_id)
                if "error" in message:
                    err = message["error"]
                    future.set_exception(
                        MCPError(err.get("code", -1), err.get("message", "Unknown error"), err.get("data"))
                    )
                else:
                    future.set_result(message.get("result", {}))
        elif "method" in message:
            method = message["method"]
            logger.info("MCP notification: %s", method)

    @property
    def is_alive(self) -> bool:
        return self._process.returncode is None

    async def close(self) -> None:
        if self._reader_task and not self._reader_task.done():
            self._reader_task.cancel()
        if self._process.stdin and not self._process.stdin.is_closing():
            self._process.stdin.close()
        self._process.terminate()
        try:
            await asyncio.wait_for(self._process.wait(), timeout=5.0)
        except asyncio.TimeoutError:
            self._process.kill()
            await self._process.wait()
