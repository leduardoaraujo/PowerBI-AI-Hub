import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Cable, Database, Menu, Plus, Settings2, Unplug, X } from "lucide-react";
import { useAppStore } from "../../store";
import { apiClient } from "../../services/api";
import { wsService } from "../../services/ws";
import { SessionList } from "../sidebar/SessionList";
import type { Session } from "../../types";

export function MainLayout() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { session, mcpStatus, setSession, setMessages, setMcpStatus } = useAppStore();
  const isConnected = Boolean(mcpStatus?.connected);

  const handleNewChat = async () => {
    try {
      const newSession = await apiClient.createSession();
      setSession(newSession as Session);
      setMessages([]);
      wsService.connect(newSession.id);
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  };

  const handleConnectData = async () => {
    try {
      const status = await apiClient.startMcp(session?.mode || "readonly");
      setMcpStatus(status);
    } catch (err) {
      console.error("Failed to start MCP:", err);
    }
  };

  const handleDisconnectData = async () => {
    try {
      await apiClient.stopMcp();
      setMcpStatus({ connected: false, pid: null, version: null, mode: "readonly", uptime_seconds: null });
    } catch (err) {
      console.error("Failed to stop MCP:", err);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[color:var(--surface-muted)] p-2 text-[color:var(--ink)] sm:p-4">
      <div className="flex h-full overflow-hidden rounded-[8px] border border-[color:var(--line)] bg-[color:var(--surface)] shadow-[0_28px_70px_rgba(17,24,39,0.12)]">
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-[color:var(--line)] bg-white/90 px-4 py-4 backdrop-blur-xl sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-12 w-12 flex-none items-center justify-center rounded-[8px] bg-[color:var(--ink)] text-white">
                  <Database className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-bold text-[color:var(--ink)]">Converse com seus dados</h1>
                  <p className="truncate text-sm text-[color:var(--ink-muted)]">Faca perguntas simples. O chat cuida do resto.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="ds-button ds-button-primary min-h-11 px-4 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Novo chat
                </button>
                <div
                  className={`flex min-h-11 items-center gap-2 rounded-[8px] border px-3 text-sm font-bold ${
                    isConnected
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-red-500"}`} />
                  {isConnected ? "Dados conectados" : "Dados desconectados"}
                </div>
                <button
                  type="button"
                  onClick={isConnected ? handleDisconnectData : handleConnectData}
                  className="ds-button ds-button-secondary min-h-11 px-4 text-sm"
                >
                  {isConnected ? <Unplug className="h-4 w-4" /> : <Cable className="h-4 w-4 text-[color:var(--success)]" />}
                  {isConnected ? "Desconectar" : "Conectar dados"}
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="ds-button ds-button-secondary hidden min-h-11 px-4 text-sm sm:inline-flex"
                >
                  <Settings2 className="h-4 w-4" />
                  Ajustes
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="ds-button ds-button-secondary h-11 w-11 px-0 sm:hidden"
                  aria-label="Abrir ajustes"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>
          <div className="min-h-0 flex-1">
            <Outlet />
          </div>
        </main>
      </div>

      {settingsOpen && (
        <div className="fixed inset-0 z-30">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            onClick={() => setSettingsOpen(false)}
            aria-label="Fechar configuracoes"
          />
          <aside className="absolute right-3 top-3 flex h-[calc(100%-1.5rem)] w-[min(380px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[8px] border border-[color:var(--line)] bg-[color:var(--surface-muted)] shadow-[0_28px_70px_rgba(17,24,39,0.24)]">
            <div className="flex items-center justify-between border-b border-[color:var(--line)] bg-white/80 px-5 py-4">
              <div>
                <p className="text-sm font-bold text-[color:var(--ink)]">Configuracoes</p>
                <p className="text-xs text-[color:var(--ink-muted)]">Use so quando precisar ajustar algo.</p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="ds-button ds-button-secondary h-9 w-9 px-0"
                aria-label="Fechar configuracoes"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SessionList compact />
          </aside>
        </div>
      )}
    </div>
  );
}
