import { useState } from "react";
import { useAppStore } from "../../store";
import { wsService } from "../../services/ws";
import { apiClient } from "../../services/api";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";

export function ChatWindow() {
  const { session, addMessage, setMessages, setLoading, isLoading } = useAppStore();
  const [streamingContent, setStreamingContent] = useState("");

  const handleSend = async (content: string) => {
    if (!session || !content.trim()) return;

    addMessage({
      id: crypto.randomUUID(),
      session_id: session.id,
      role: "user",
      content,
      tool_calls: [],
      timestamp: new Date().toISOString(),
    });

    setLoading(true);
    setStreamingContent("");

    if (wsService.ws?.readyState === WebSocket.OPEN) {
      wsService.send(content, session.provider, session.model);
      return;
    }

    try {
      const result = await apiClient.sendMessage(session.id, content, session.provider, session.model);
      const events = (result as { events: Array<Record<string, unknown>> }).events || [];

      let assistantContent = "";
      for (const event of events) {
        if (event.type === "message" && event.content) {
          assistantContent += event.content as string;
        }
      }

      if (assistantContent) {
        addMessage({
          id: crypto.randomUUID(),
          session_id: session.id,
          role: "assistant",
          content: assistantContent,
          tool_calls: [],
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      addMessage({
        id: crypto.randomUUID(),
        session_id: session.id,
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
        tool_calls: [],
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <MessageList streamingContent={streamingContent} />
      </div>
      <MessageInput onSend={handleSend} disabled={isLoading || !session} />
    </div>
  );
}