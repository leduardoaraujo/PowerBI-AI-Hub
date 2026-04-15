import { useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { MessageSquareText, Sparkles } from "lucide-react";
import { useAppStore } from "../../store";
import { MessageBubble } from "./MessageBubble";
import { ToolCallCard } from "../tools/ToolCallCard";

interface MessageListProps {
  streamingContent?: string;
  onPromptSelect?: (content: string) => void | Promise<void>;
}

const starterPrompts = [
  "Quais foram os principais resultados?",
  "Me explique esses dados em palavras simples.",
  "Onde tem algo estranho nos numeros?",
];

export function MessageList({ streamingContent, onPromptSelect }: MessageListProps) {
  const { messages } = useAppStore();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col">
      {messages.length === 0 && !streamingContent && (
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-4xl text-center">
            <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-[8px] bg-[color:var(--ink)] text-white shadow-[0_18px_36px_rgba(17,24,39,0.18)]">
              <Sparkles className="h-7 w-7" />
            </div>
            <p className="mb-3 text-sm font-bold uppercase text-[color:var(--accent)]">Chat pronto</p>
            <h1 className="text-4xl font-bold text-[color:var(--ink)]">Pergunte sobre seus dados.</h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[color:var(--ink-soft)]">
              Escreva como se estivesse falando com uma pessoa. O sistema abre a conversa automaticamente.
            </p>
            <div className="mx-auto mt-8 grid max-w-4xl gap-3 text-left md:grid-cols-3">
              {starterPrompts.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onPromptSelect?.(label)}
                  className="ds-button ds-button-secondary min-h-16 justify-start px-4 text-base"
                >
                  <MessageSquareText className="h-4 w-4 text-[color:var(--accent)]" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
      {messages.map((msg) => (
        <div key={msg.id}>
          <MessageBubble message={msg} />
          {msg.tool_calls.map((tc) => (
            <ToolCallCard key={tc.id} toolCall={tc} />
          ))}
        </div>
      ))}
      {streamingContent && (
        <div className="flex justify-start">
          <div className="message-markdown max-w-[80%] rounded-[8px] border border-[color:var(--line)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--ink)]">
            <Markdown>{streamingContent}</Markdown>
          </div>
        </div>
      )}
      <div ref={endRef} />
      </div>
    </div>
  );
}
