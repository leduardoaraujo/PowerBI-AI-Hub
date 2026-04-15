import { create } from "zustand";
import type { Session, ChatMessage, MCPStatus, ApprovalRequest } from "../types";

interface AppState {
  session: Session | null;
  messages: ChatMessage[];
  mcpStatus: MCPStatus | null;
  pendingApprovals: ApprovalRequest[];
  isLoading: boolean;

  setSession: (s: Session | null) => void;
  addMessage: (m: ChatMessage) => void;
  updateMessage: (id: string, partial: Partial<ChatMessage>) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  setMcpStatus: (s: MCPStatus) => void;
  addApproval: (a: ApprovalRequest) => void;
  removeApproval: (id: string) => void;
  setLoading: (v: boolean) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  session: null,
  messages: [],
  mcpStatus: null,
  pendingApprovals: [],
  isLoading: false,

  setSession: (s) => set({ session: s }),
  addMessage: (m) => set((state) => ({ messages: [...state.messages, m] })),
  updateMessage: (id, partial) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...partial } : msg
      ),
    })),
  setMessages: (msgs) => set({ messages: msgs }),
  setMcpStatus: (s) => set({ mcpStatus: s }),
  addApproval: (a) =>
    set((state) => ({ pendingApprovals: [...state.pendingApprovals, a] })),
  removeApproval: (id) =>
    set((state) => ({
      pendingApprovals: state.pendingApprovals.filter((p) => p.id !== id),
    })),
  setLoading: (v) => set({ isLoading: v }),
  reset: () =>
    set({
      session: null,
      messages: [],
      pendingApprovals: [],
      isLoading: false,
    }),
}));