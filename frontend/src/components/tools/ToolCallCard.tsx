import { useState } from "react";
import { ChevronDown, ChevronRight, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { ToolCall } from "../../types";

interface ToolCallCardProps {
  toolCall: ToolCall;
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon = {
    pending: <Loader2 className="h-4 w-4 animate-spin text-[color:var(--ink-muted)]" />,
    running: <Loader2 className="h-4 w-4 animate-spin text-[color:var(--accent)]" />,
    completed: <CheckCircle className="h-4 w-4 text-emerald-600" />,
    error: <XCircle className="h-4 w-4 text-red-600" />,
  }[toolCall.status] || <AlertCircle className="h-4 w-4 text-amber-600" />;

  const badgeColor = {
    read: "border-emerald-200 bg-emerald-50 text-emerald-700",
    write: "border-red-200 bg-red-50 text-red-700",
    mixed: "border-amber-200 bg-amber-50 text-amber-700",
  }[toolCall.classification] || "border-[color:var(--line)] bg-white text-[color:var(--ink-soft)]";

  return (
    <div className="my-3 ml-8 overflow-hidden rounded-[8px] border border-[color:var(--line)] bg-white/75 shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[color:var(--surface-muted)]"
      >
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {statusIcon}
        <span className="min-w-0 flex-1 truncate font-mono text-sm font-semibold text-[color:var(--ink)]">{toolCall.name}</span>
        <span className={`ds-badge ${badgeColor}`}>
          {toolCall.classification}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-[color:var(--line)] px-3 pb-3 pt-3">
          <div className="mb-1 text-xs font-bold uppercase text-[color:var(--ink-muted)]">Argumentos</div>
          <pre className="max-h-48 overflow-auto rounded-[8px] bg-[#15171d] p-3 text-xs text-[#f7f4ee]">
            {JSON.stringify(toolCall.arguments, null, 2)}
          </pre>
          {toolCall.result !== undefined && (
            <>
              <div className="mb-1 mt-3 text-xs font-bold uppercase text-[color:var(--ink-muted)]">Resultado</div>
              <pre className="max-h-48 overflow-auto rounded-[8px] bg-[#15171d] p-3 text-xs text-[#f7f4ee]">
                {typeof toolCall.result === "string"
                  ? toolCall.result
                  : JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}
