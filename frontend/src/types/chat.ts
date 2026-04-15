export interface Session {
  id: string;
  provider: "openai" | "claude";
  model: string;
  mode: "readonly" | "readwrite";
  mcp_connected: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls: ToolCall[];
  timestamp: string;
  isStreaming?: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status: "pending" | "running" | "completed" | "error";
  classification: "read" | "write" | "mixed";
}

export interface ApprovalRequest {
  id: string;
  tool_call_id: string;
  tool_name: string;
  arguments: Record<string, unknown>;
  risk_level: "read" | "write";
  diff_preview?: DiffPreview;
  created_at: string;
  expires_at: string;
}

export interface DiffPreview {
  action: "create" | "update" | "delete";
  object_type: string;
  object_name: string;
  before: string | null;
  after: string | null;
}

export interface MCPStatus {
  connected: boolean;
  pid: number | null;
  version: string | null;
  mode: string;
  uptime_seconds: number | null;
}

export interface MCPToolInfo {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  classification: string;
}

export type WSEvent =
  | { type: "message"; content: string }
  | { type: "tool_call_start"; tool_call_id: string; tool_name: string; arguments: Record<string, unknown>; classification: string }
  | { type: "tool_call_end"; tool_call_id: string; result: unknown }
  | { type: "tool_call_error"; tool_call_id: string; error: string }
  | { type: "approval_required"; approval: ApprovalRequest }
  | { type: "done" }
  | { type: "error"; error: string };