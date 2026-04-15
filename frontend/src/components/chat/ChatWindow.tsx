import { useAppStore } from "../../store";
import { apiClient } from "../../services/api";
import { wsService } from "../../services/ws";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import type { Session } from "../../types";

export function ChatWindow() {
  const { session, setSession, isLoading, addMessage, setLoading } = useAppStore();

  const ensureSession = async () => {
    if (session) return session;
    const newSession = await apiClient.createSession();
    setSession(newSession);
    return newSession;
  };

  const addUserMessage = (content: string, activeSession: Session) => {
    addMessage({
      id: crypto.randomUUID(),
      session_id: activeSession.id,
      role: "user",
      content,
      tool_calls: [],
      timestamp: new Date().toISOString(),
    });
  };

  const handleSendREST = async (content: string, activeSession: Session) => {
    addUserMessage(content, activeSession);
    setLoading(true);

    try {
      const result = await apiClient.sendMessage(
        activeSession.id,
        content,
        activeSession.provider,
        activeSession.model
      );
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
          session_id: activeSession.id,
          role: "assistant",
          content: assistantContent,
          tool_calls: [],
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      addMessage({
        id: crypto.randomUUID(),
        session_id: activeSession.id,
        role: "assistant",
        content: `Nao consegui responder agora. ${err instanceof Error ? err.message : "Tente novamente em instantes."}`,
        tool_calls: [],
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendWS = (content: string, activeSession: Session) => {
    addUserMessage(content, activeSession);
    setLoading(true);
    wsService.send(content, activeSession.provider, activeSession.model);
  };

  const handleSend = async (content: string) => {
    setLoading(true);
    try {
      const activeSession = await ensureSession();
      if (wsService.isConnected()) {
        handleSendWS(content, activeSession);
      } else {
        await handleSendREST(content, activeSession);
      }
    } catch (err) {
      console.error("Failed to start chat:", err);
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 bg-[color:var(--surface)]">
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8 sm:px-8">
          <MessageList onPromptSelect={handleSend} />
        </div>
        <MessageInput onSend={handleSend} disabled={isLoading} isLoading={isLoading} />
      </section>
    </div>
  );
}
