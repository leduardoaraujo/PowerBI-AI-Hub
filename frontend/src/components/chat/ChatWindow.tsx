import { useAppStore } from "../../store";
import { apiClient } from "../../services/api";
import { wsService } from "../../services/ws";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";

export function ChatWindow() {
  const { session, isLoading, addMessage, setLoading } = useAppStore();

  const handleSendREST = async (content: string) => {
    if (!session) return;

    addMessage({
      id: crypto.randomUUID(),
      session_id: session.id,
      role: "user",
      content,
      tool_calls: [],
      timestamp: new Date().toISOString(),
    });

    setLoading(true);

    try {
      const result = await apiClient.sendMessage(session.id, content, session.provider, session.model);
      const events = (result as { events?: Array<{ type?: string; content?: string }> }).events || [];

      let assistantContent = "";
      for (const event of events) {
        if (event.type === "message" && event.content) {
          assistantContent += event.content;
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

  const handleSendWS = (content: string) => {
    if (!session) return;
    addMessage({
      id: crypto.randomUUID(),
      session_id: session.id,
      role: "user",
      content,
      tool_calls: [],
      timestamp: new Date().toISOString(),
    });
    setLoading(true);
    wsService.send(content, session.provider, session.model);
  };

  const handleSend = (content: string) => {
    if (wsService.isConnected()) {
      handleSendWS(content);
    } else {
      handleSendREST(content);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <MessageList />
      </div>
      <MessageInput onSend={handleSend} disabled={isLoading || !session} />
    </div>
  );
}