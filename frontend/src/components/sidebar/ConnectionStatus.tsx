import { Wifi, WifiOff } from "lucide-react";
import { useAppStore } from "../../store";

export function ConnectionStatus() {
  const { mcpStatus } = useAppStore();

  if (!mcpStatus) {
    return (
      <div className="ds-panel rounded-[8px] p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-red-50 text-red-600">
            <WifiOff className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[color:var(--ink)]">Dados desconectados</p>
            <p className="text-xs text-[color:var(--ink-muted)]">Conecte para consultar seu modelo.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-panel rounded-[8px] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-[8px] ${
              mcpStatus.connected ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            }`}
          >
            {mcpStatus.connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          </span>
          <div>
            <p className="text-sm font-semibold text-[color:var(--ink)]">
              {mcpStatus.connected ? "Dados conectados" : "Dados desconectados"}
            </p>
            <p className="text-xs text-[color:var(--ink-muted)]">
              {mcpStatus.connected ? "Pronto para perguntas" : "Conecte para consultar dados"}
            </p>
          </div>
        </div>
        <span
          className={`ds-badge ${
            mcpStatus.mode === "readonly"
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {mcpStatus.mode === "readonly" ? "seguro" : "edicao"}
        </span>
      </div>
    </div>
  );
}
