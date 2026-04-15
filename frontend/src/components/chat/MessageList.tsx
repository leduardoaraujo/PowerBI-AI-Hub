import React, { useRef, useEffect } from "react";
import Markdown from "react-markdown";
import { useAppStore } from "../../store";
import { MessageBubble } from "./MessageBubble";
import { ToolCallCard } from "../tools/ToolCallCard";

interface MessageListProps {
  streamingContent?: string;
}

export function MessageList({ streamingContent }: MessageListProps) {
  const { messages } = useAppStore();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="space-y-4">
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
          <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[80%]">
            <Markdown>{streamingContent}</Markdown>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}