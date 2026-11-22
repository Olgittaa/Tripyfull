"use client";

import { useEffect, useRef } from "react";
import type { ChatStatus, UIMessage } from "ai";

type Props = {
  messages: UIMessage[];
  status: ChatStatus;
};

/** All text parts of a message, joined. Later messages also carry tool parts (cards). */
function textOf(message: UIMessage): string {
  return message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
}

const bubble = "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed";

export default function MessageList({ messages, status }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep the newest words in view: on every new message and on every streamed chunk
  // (each chunk produces a new `messages` array, so this effect runs again).
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  // "submitted": the request is out, but not a single token has arrived yet.
  const thinking = status === "submitted";

  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      {messages.length === 0 && (
        <div className={`${bubble} self-start rounded-tl-sm bg-card shadow-sm`}>
          Hi! I&apos;m your trip assistant. Ask me anything about your trip — soon I&apos;ll
          also see the page you&apos;re on and look up real places and flights.
        </div>
      )}

      {messages.map((message) => {
        const text = textOf(message);
        if (!text) return null; // an assistant message that has not produced text yet
        return message.role === "user" ? (
          <div key={message.id} className={`${bubble} self-end rounded-tr-sm bg-primary text-card`}>
            {text}
          </div>
        ) : (
          <div key={message.id} className={`${bubble} self-start rounded-tl-sm bg-card shadow-sm`}>
            {text}
          </div>
        );
      })}

      {thinking && (
        <div
          className={`${bubble} self-start rounded-tl-sm bg-card shadow-sm`}
          role="status"
          aria-label="The assistant is thinking"
        >
          <span className="flex gap-1 py-1">
            <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted" />
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
