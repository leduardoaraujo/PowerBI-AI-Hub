import { useState } from "react";
import { ChevronDown, ChevronRight, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { ToolCall } from "../../types";

interface ToolCallCardProps {
  toolCall: ToolCall;
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon = {
    pending: <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />,
    running: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
    completed: <CheckCircle className="w-4 h-4 text-green-500" />,
    error: <XCircle className="w-4 h-4 text-red-500" />,
  }[toolCall.status] || <AlertCircle className="w-4 h-4 text-yellow-500" />;

  const badgeColor = {
    read: "bg-green-100 text-green-700",
    write: "bg-red-100 text-red-700",
    mixed: "bg-yellow-100 text-yellow-700",
  }[toolCall.classification] || "bg-gray-100 text-gray-700";

  return (
    <div className="my-2 ml-8 border rounded-lg bg-white shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded-lg"
      >
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        {statusIcon}
        <span className="font-mono text-sm font-medium">{toolCall.name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${badgeColor}`}>
          {toolCall.classification}
        </span>
      </button>
      {expanded && (
        <div className="px-3 pb-2">
          <div className="text-xs text-gray-500 mb-1">Arguments:</div>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-48">
            {JSON.stringify(toolCall.arguments, null, 2)}
          </pre>
          {toolCall.result !== undefined && (
            <>
              <div className="text-xs text-gray-500 mt-2 mb-1">Result:</div>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-48">
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