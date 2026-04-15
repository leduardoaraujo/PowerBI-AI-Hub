import { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { ChatWindow } from "./components/chat/ChatWindow";
import { useAppStore } from "./store";
import { apiClient } from "./services/api";
import { wsService } from "./services/ws";

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <ChatWindow /> },
    ],
  },
]);

function App() {
  const session = useAppStore((s) => s.session);
  const setMcpStatus = useAppStore((s) => s.setMcpStatus);
  const addMessage = useAppStore((s) => s.addMessage);
  const setLoading = useAppStore((s) => s.setLoading);

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
    if (!session) return;

    wsService.connect(session.id);

    wsService.on("message", (event) => {
      if (!event) return;
      if (event.type === "message" && "content" in event && event.content) {
        addMessage({
          id: crypto.randomUUID(),
          session_id: session.id,
          role: "assistant",
          content: event.content as string,
          tool_calls: [],
          timestamp: new Date().toISOString(),
        });
        setLoading(false);
      }
    });

    return () => {
      wsService.disconnect();
    };
  }, [session, addMessage, setLoading]);

  return <RouterProvider router={router} />;
}

export default App;