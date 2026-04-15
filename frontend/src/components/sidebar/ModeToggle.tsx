import { LockKeyhole, PencilLine } from "lucide-react";
import { useAppStore } from "../../store";
import { apiClient } from "../../services/api";

export function ModeToggle() {
  const { session, setSession } = useAppStore();
  const isReadWrite = session?.mode === "readwrite";

  const handleToggle = async () => {
    if (!session) return;
    const newMode = session.mode === "readonly" ? "readwrite" : "readonly";
    if (newMode === "readwrite") {
      const confirmed = window.confirm(
        "O modo de edicao permite modificar o modelo do Power BI. Continuar?"
      );
      if (!confirmed) return;
    }
    const newSession = await apiClient.createSession(session.provider, session.model, newMode);
    setSession(newSession);
  };

  return (
    <div className="rounded-[8px] border border-[color:var(--line)] bg-white/55 p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-[8px] ${
              isReadWrite ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
            }`}
          >
            {isReadWrite ? <PencilLine className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
          </span>
          <div>
            <p className="text-sm font-semibold text-[color:var(--ink)]">Seguranca</p>
            <p className="text-xs text-[color:var(--ink-muted)]">
              {isReadWrite ? "Pode alterar dados" : "Apenas consulta"}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-7 w-12 flex-none items-center rounded-full transition-colors ${
            isReadWrite ? "bg-amber-500" : "bg-[color:var(--surface-strong)]"
          }`}
          aria-label="Alternar modo"
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
              isReadWrite ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
