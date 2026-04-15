import type { ChatMessage } from "../../types";
import Markdown from "react-markdown";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const authorLabel = {
    user: "Voce",
    assistant: "Assistente",
    system: "Sistema",
    tool: "Ferramenta",
  }[message.role];
  const timeLabel = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(message.timestamp));

  return (
    <div className={`flex animate-[message-in_180ms_ease-out] ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-[8px] px-4 py-3 text-sm shadow-sm ${
          isUser
            ? "bg-[color:var(--accent)] text-white"
            : "border border-[color:var(--line)] bg-[color:var(--surface-muted)] text-[color:var(--ink)]"
        }`}
      >
        <div className={`mb-2 flex items-center justify-between gap-4 text-xs ${isUser ? "text-blue-100" : "text-[color:var(--ink-muted)]"}`}>
          <span className="font-bold">{authorLabel}</span>
          <span>{timeLabel}</span>
        </div>
        <div className="message-markdown max-w-none leading-6">
          <Markdown>{message.content}</Markdown>
        </div>
      </div>
    </div>
  );
}
