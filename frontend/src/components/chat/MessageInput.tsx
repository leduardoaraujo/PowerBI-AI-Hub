import { useState } from "react";
import { Loader2, Send } from "lucide-react";

interface MessageInputProps {
  onSend: (content: string) => void | Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
}

export function MessageInput({ onSend, disabled, isLoading = false }: MessageInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-[color:var(--line)] bg-white/90 p-4 backdrop-blur-xl sm:p-5">
      <div className="mx-auto w-full max-w-6xl">
        <label htmlFor="message-input" className="sr-only">Mensagem</label>
        <div className="flex min-h-16 items-center gap-3 rounded-[8px] border border-[color:var(--line)] bg-white px-4 shadow-[0_14px_34px_rgba(17,24,39,0.08)] transition-shadow focus-within:shadow-[0_18px_38px_rgba(37,99,235,0.12)]">
          <input
            id="message-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "Aguardando resposta..." : "Pergunte qualquer coisa sobre seus dados..."}
            disabled={disabled}
            className="min-h-14 min-w-0 flex-1 border-0 bg-transparent px-1 text-base text-[color:var(--ink)] outline-none placeholder:text-[color:var(--ink-muted)] disabled:text-[color:var(--ink-muted)]"
          />
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="ds-button ds-button-primary h-12 min-h-12 flex-none px-5 text-base disabled:translate-y-0 disabled:bg-[color:var(--surface-strong)] disabled:text-[color:var(--ink-muted)] disabled:shadow-none"
            aria-label="Enviar mensagem"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </div>
        <p className="mt-2 text-xs text-[color:var(--ink-muted)]">Digite sua pergunta e aperte Enter.</p>
      </div>
    </form>
  );
}
