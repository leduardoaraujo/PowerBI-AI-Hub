import { useAppStore } from "../../store";
import { apiClient } from "../../services/api";
import type { Session } from "../../types";

export function ProviderSelector() {
  const { session, setSession } = useAppStore();

  const providers = [
    { id: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"] },
    { id: "claude", label: "Claude", models: ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022"] },
  ];

  const handleProviderChange = async (provider: string) => {
    try {
      const newSession = await apiClient.createSession(provider, providers.find(p => p.id === provider)!.models[0], session?.mode || "readonly");
      setSession(newSession as Session);
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  };

  const handleModelChange = async (model: string) => {
    if (!session) return;
    setSession({ ...session, model });
  };

  const currentProvider = providers.find((p) => p.id === session?.provider);

  return (
    <div className="px-4 py-3 border-b">
      <label className="block text-xs font-medium text-gray-500 mb-1">Provider</label>
      <select
        value={session?.provider || ""}
        onChange={(e) => handleProviderChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
      >
        <option value="" disabled>Select provider</option>
        {providers.map((p) => (
          <option key={p.id} value={p.id}>{p.label}</option>
        ))}
      </select>

      {currentProvider && (
        <>
          <label className="block text-xs font-medium text-gray-500 mt-2 mb-1">Model</label>
          <select
            value={session?.model || ""}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            {currentProvider.models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}