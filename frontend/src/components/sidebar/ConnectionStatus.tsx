import { Wifi, WifiOff } from "lucide-react";
import { useAppStore } from "../../store";

export function ConnectionStatus() {
  const { mcpStatus } = useAppStore();

  if (!mcpStatus) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm px-4 py-2">
        <WifiOff className="w-4 h-4" />
        <span>MCP: Not connected</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-sm px-4 py-2 ${
      mcpStatus.connected ? "text-green-600" : "text-red-500"
    }`}>
      {mcpStatus.connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
      <span>MCP: {mcpStatus.connected ? "Connected" : "Disconnected"}</span>
      {mcpStatus.connected && mcpStatus.pid && (
        <span className="text-gray-400">(PID: {mcpStatus.pid})</span>
      )}
      <span className={`text-xs px-2 py-0.5 rounded ${
        mcpStatus.mode === "readonly" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
      }`}>
        {mcpStatus.mode}
      </span>
    </div>
  );
}