import type { WSEvent } from "../types";

export class WebSocketService {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private onMessage: ((event: WSEvent) => void) | null = null;
  private onDisconnect: (() => void) | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(sessionId: string) {
    this.sessionId = sessionId;
    const url = `ws://localhost:8000/ws/${sessionId}`;
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      try {
        const data: WSEvent = JSON.parse(event.data);
        this.onMessage?.(data);
      } catch {
        console.error("Failed to parse WS message:", event.data);
      }
    };

    this.ws.onclose = () => {
      this.onDisconnect?.();
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
      this.onMessage = handler as (event: WSEvent) => void;
    } else if (event === "disconnect") {
      this.onDisconnect = handler as () => void;
    }
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