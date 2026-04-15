import { useAppStore } from "../../store";
import { apiClient } from "../../services/api";

export function ModeToggle() {
  const { session, setSession } = useAppStore();

  const handleToggle = async () => {
    if (!session) return;
    const newMode = session.mode === "readonly" ? "readwrite" : "readonly";
    if (newMode === "readwrite") {
      const confirmed = window.confirm(
        "Switching to readwrite mode allows modifications to the Power BI model. Continue?"
      );
      if (!confirmed) return;
    }
    const newSession = await apiClient.createSession(session.provider, session.model, newMode);
    setSession(newSession);
  };

  return (
    <div className="px-4 py-3 border-b">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Mode</span>
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            session?.mode === "readwrite" ? "bg-orange-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              session?.mode === "readwrite" ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {session?.mode === "readwrite" ? "Read/Write — changes can modify model" : "Read Only — safe to explore"}
      </div>
    </div>
  );
}