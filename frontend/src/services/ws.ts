import type { WSEvent } from "../types";

export class WebSocketService {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private messageHandler: ((event: WSEvent) => void) | null = null;
  private disconnectHandler: (() => void) | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(sessionId: string) {
    this.sessionId = sessionId;
    const url = `ws://localhost:8000/ws?session_id=${sessionId}`;
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      try {
        const data: WSEvent = JSON.parse(event.data);
        this.messageHandler?.(data);
      } catch {
        console.error("Failed to parse WS message:", event.data);
      }
    };

    this.ws.onclose = () => {
      this.disconnectHandler?.();
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  send(content: string, provider?: string, model?: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ content, provider, model }));
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  on(event: "message" | "disconnect", handler: (data: WSEvent | void) => void) {
    if (event === "message") {
      this.messageHandler = handler as (event: WSEvent) => void;
    } else if (event === "disconnect") {
      this.disconnectHandler = handler as () => void;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || !this.sessionId) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.sessionId) {
        this.connect(this.sessionId);
      }
    }, 3000);
  }
}

export const wsService = new WebSocketService();