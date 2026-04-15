from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "PowerBI AI Hub"
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = ["http://localhost:5173"]

    openai_api_key: str = ""
    anthropic_api_key: str = ""

    mcp_exe_path: str = ""
    mcp_default_mode: str = "readonly"
    mcp_start_args: list[str] = ["--start"]
    mcp_request_timeout: float = 30.0
    mcp_health_check_interval: float = 15.0

    approval_timeout_seconds: int = 600

    download_base_url: str = (
        "https://marketplace.visualstudio.com/_apis/public/gallery/"
        "publishers/analysis-services/vsextensions/powerbi-modeling-mcp/"
    )
    mcp_bin_dir: str = "mcp_bin"

    default_provider: str = "openai"
    default_model: str = "gpt-4o"

    audit_log_dir: str = "audit_logs"

    max_tool_calls_per_message: int = 10

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
