import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { ChatWindow } from "./components/chat/ChatWindow";
import { useAppStore } from "./store";
import { apiClient } from "./services/api";
import { wsService } from "./services/ws";

function App() {
  const { setSession, setMessages, setMcpStatus, session } = useAppStore();

  useEffect(() => {
    const init = async () => {
      try {
        const status = await apiClient.getMcpStatus();
        setMcpStatus(status);
      } catch {
        setMcpStatus({ connected: false, pid: null, version: null, mode: "readonly", uptime_seconds: null });
      }
    };
    init();
  }, [setMcpStatus]);

  useEffect(() => {
    if (session) {
      wsService.connect(session.id);
      wsService.on("message", (event) => {
        if (event.type === "message" && event.content) {
          setMessages([
            ...useAppStore.getState().messages,
            {
              id: crypto.randomUUID(),
              session_id: session.id,
              role: "assistant",
              content: event.content as string,
              tool_calls: [],
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      });
      return () => {
        wsService.disconnect();
      };
    }
  }, [session, setMessages]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<ChatWindow />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;