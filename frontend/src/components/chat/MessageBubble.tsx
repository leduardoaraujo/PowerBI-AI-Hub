import type { ChatMessage } from "../../types";
import Markdown from "react-markdown";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`rounded-lg px-4 py-2 max-w-[80%] ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900"
        }`}
      >
        <div className="text-xs text-gray-400 mb-1">
          {isUser ? "You" : "Assistant"}
        </div>
        <div className="prose prose-sm max-w-none">
          <Markdown>{message.content}</Markdown>
        </div>
      </div>
    </div>
  );
}