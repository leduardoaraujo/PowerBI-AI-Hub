import ky from "ky";
import type { Session, MCPStatus, MCPToolInfo } from "../types";

const api = ky.create({ prefixUrl: "http://localhost:8000/api" });

export const apiClient = {
  createSession: async (provider = "openai", model = "gpt-4o", mode = "readonly"): Promise<Session> => {
    return api.post("sessions", { json: { provider, model, mode } }).json();
  },

  listSessions: async (): Promise<Session[]> => {
    return api.get("sessions").json();
  },

  getSession: async (id: string): Promise<Session> => {
    return api.get(`sessions/${id}`).json();
  },

  deleteSession: async (id: string): Promise<void> => {
    await api.delete(`sessions/${id}`);
  },

  sendMessage: async (sessionId: string, content: string, provider?: string, model?: string): Promise<unknown> => {
    return api
      .post(`sessions/${sessionId}/messages`, {
        json: { content, provider, model },
      })
      .json();
  },

  getMcpStatus: async (): Promise<MCPStatus> => {
    return api.get("mcp/status").json();
  },

  startMcp: async (mode = "readonly"): Promise<MCPStatus> => {
    return api.post("mcp/start", { json: { mode } }).json();
  },

  stopMcp: async (): Promise<void> => {
    await api.post("mcp/stop");
  },

  getMcpTools: async (): Promise<MCPToolInfo[]> => {
    return api.get("mcp/tools").json();
  },

  downloadMcp: async (version?: string, platform?: string): Promise<{ status: string; version: string; path: string }> => {
    return api
      .post("mcp/download", { json: { version, platform } })
      .json();
  },

  approve: async (approvalId: string): Promise<void> => {
    await api.post(`approval/${approvalId}/approve`);
  },

  reject: async (approvalId: string): Promise<void> => {
    await api.post(`approval/${approvalId}/reject`);
  },
};