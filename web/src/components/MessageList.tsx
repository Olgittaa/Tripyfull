"use client";

import { useEffect, useRef } from "react";
import { getToolName, isToolUIPart, type ChatStatus, type UIMessage } from "ai";

type Props = {
  messages: UIMessage[];
  status: ChatStatus;
};

const bubble = "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed";
const assistantBubble = `${bubble} self-start rounded-tl-sm bg-card shadow-sm`;

/** What each tool does, in words for the user: while running, and when done. */
const TOOL_LABELS: Record<string, [running: string, done: string]> = {
  get_trip: ["Looking at your trip…", "Read your trip"],
  get_day: ["Looking at this day…", "Read this day's plan"],
};

type ToolPart = Extract<UIMessage["parts"][number], { toolCallId: string }>;

/** A small line under the answer: the agent is (or was) using a tool. */
function ToolActivity({ part }: { part: ToolPart }) {
  const name = getToolName(part);
  const [running, done] = TOOL_LABELS[name] ?? [`Using ${name}…`, `Used ${name}`];
  const failed = part.state === "output-error";
  const finished = part.state === "output-available";
  return (
    <div className={`flex items-center gap-1.5 self-start text-xs ${failed ? "text-accent" : "text-muted"}`}>
      <span aria-hidden="true">{failed ? "⚠" : finished ? "✓" : "⋯"}</span>
      {failed ? `Couldn't read it: ${part.errorText}` : finished ? done : running}
    </div>
  );
}

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
        <div className={assistantBubble}>
          Hi! I&apos;m your trip assistant. Open a trip or one of its days and ask me about it — I
          read your real plan before answering.
        </div>
      )}

      {messages.map((message) =>
        message.role === "user" ? (
          <div key={message.id} className={`${bubble} self-end rounded-tr-sm bg-primary text-card`}>
            {message.parts.map((part) => (part.type === "text" ? part.text : "")).join("")}
          </div>
        ) : (
          // An assistant message is a sequence of parts, in the order they happened:
          // tool calls first, then the text written from their results.
          <div key={message.id} className="flex flex-col gap-2">
            {message.parts.map((part, i) => {
              const key = `${message.id}-${i}`;
              if (isToolUIPart(part)) return <ToolActivity key={key} part={part} />;
              if (part.type === "text" && part.text) {
                return (
                  <div key={key} className={assistantBubble}>
                    {part.text}
                  </div>
                );
              }
              return null;
            })}
          </div>
        ),
      )}

      {thinking && (
        <div className={assistantBubble} role="status" aria-label="The assistant is thinking">
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
