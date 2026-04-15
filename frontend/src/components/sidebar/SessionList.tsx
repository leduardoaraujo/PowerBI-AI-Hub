import { useAppStore } from "../../store";
import { wsService } from "../../services/ws";
import { apiClient } from "../../services/api";
import { ConnectionStatus } from "./ConnectionStatus";
import { ProviderSelector } from "./ProviderSelector";
import { ModeToggle } from "./ModeToggle";
import type { Session } from "../../types";
import { Cable, Plus, Power, Sparkles, Trash2, Unplug } from "lucide-react";

interface SessionListProps {
  compact?: boolean;
}

export function SessionList({ compact = false }: SessionListProps) {
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
    <div className={`${compact ? "max-h-[76vh]" : "h-full"} flex flex-col overflow-hidden bg-[color:var(--surface-muted)]`}>
      <div className="border-b border-[color:var(--line)] p-5">
        {!compact && (
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[color:var(--ink)] text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[color:var(--ink)]">PowerBI AI Hub</p>
              <p className="text-xs text-[color:var(--ink-muted)]">Chat para conversar com dados</p>
            </div>
          </div>
        )}
        <button
          onClick={handleNewSession}
          className="ds-button ds-button-primary w-full"
        >
          <Plus className="h-4 w-4" />
          Nova conversa
        </button>
      </div>

      <div className="space-y-4 overflow-y-auto p-4">
        <ConnectionStatus />

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleConnectMCP}
            className="ds-button ds-button-secondary min-h-9 px-3 text-xs"
          >
            <Cable className="h-3.5 w-3.5 text-[color:var(--success)]" />
            Conectar dados
          </button>
          <button
            onClick={handleDisconnect}
            className="ds-button ds-button-secondary min-h-9 px-3 text-xs"
          >
            <Unplug className="h-3.5 w-3.5 text-[color:var(--ink-muted)]" />
            Desconectar
          </button>
        </div>

        <ProviderSelector />
        <ModeToggle />
      </div>

      <div className="flex-1" />

      {session && (
        <div className="border-t border-[color:var(--line)] p-4">
          <div className="mb-3 flex items-center gap-2 text-xs text-[color:var(--ink-muted)]">
            <Power className="h-3.5 w-3.5" />
            Conversa ativa
          </div>
          <button
            onClick={handleDisconnectSession}
            className="ds-button ds-button-danger w-full"
          >
            <Trash2 className="h-4 w-4" />
            Encerrar conversa
          </button>
        </div>
      )}
    </div>
  );
}
