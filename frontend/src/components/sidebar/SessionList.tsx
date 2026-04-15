import { useAppStore } from "../../store";
import { wsService } from "../../services/ws";
import { apiClient } from "../../services/api";
import { ConnectionStatus } from "./ConnectionStatus";
import { ProviderSelector } from "./ProviderSelector";
import { ModeToggle } from "./ModeToggle";
import type { Session } from "../../types";
import { Plug, Trash2 } from "lucide-react";

export function SessionList() {
  const { session, setSession, setMessages, setMcpStatus, reset } = useAppStore();

  const handleNewSession = async () => {
    try {
      const newSession = await apiClient.createSession();
      setSession(newSession as Session);
      setMessages([]);
      wsService.connect(newSession.id);
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  };

  const handleConnectMCP = async () => {
    try {
      const status = await apiClient.startMcp(session?.mode || "readonly");
      setMcpStatus(status);
    } catch (err) {
      console.error("Failed to start MCP:", err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await apiClient.stopMcp();
      setMcpStatus({ connected: false, pid: null, version: null, mode: "readonly", uptime_seconds: null });
    } catch (err) {
      console.error("Failed to stop MCP:", err);
    }
  };

  const handleDisconnectSession = () => {
    wsService.disconnect();
    reset();
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r">
      <div className="p-4 border-b">
        <button
          onClick={handleNewSession}
          className="w-full rounded-lg bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 transition-colors"
        >
          New Session
        </button>
      </div>

      <ConnectionStatus />

      <div className="px-4 py-2 flex gap-2">
        <button
          onClick={handleConnectMCP}
          className="flex items-center gap-1 rounded px-3 py-1.5 text-xs bg-green-600 text-white hover:bg-green-700"
        >
          <Plug className="w-3 h-3" /> Connect MCP
        </button>
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-1 rounded px-3 py-1.5 text-xs bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          Disconnect
        </button>
      </div>

      <ProviderSelector />
      <ModeToggle />

      <div className="flex-1" />

      {session && (
        <div className="p-4 border-t">
          <button
            onClick={handleDisconnectSession}
            className="w-full flex items-center justify-center gap-2 rounded px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" /> End Session
          </button>
        </div>
      )}
    </div>
  );
}