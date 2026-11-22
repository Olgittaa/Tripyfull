"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import MessageList from "@/components/MessageList";

// The whole chat window as the portal shows it in its iframe panel.

const portalOrigin = process.env.NEXT_PUBLIC_PORTAL_ORIGIN ?? "http://localhost:5173";

/** Asks the portal to close the panel. Only the portal's origin may receive it. */
function requestClose() {
  if (window.parent !== window) {
    window.parent.postMessage({ type: "tripyfull-chat:close" }, portalOrigin);
  }
}

export default function ChatPanel() {
  const [input, setInput] = useState("");
  // useChat keeps the conversation and POSTs it to /api/chat; the answer streams back
  // into `messages` piece by piece. status: ready → submitted → streaming → ready (or error).
  const { messages, sendMessage, status, stop, error, regenerate } = useChat();
  const busy = status === "submitted" || status === "streaming";

  // While the user types here, key presses stay inside the iframe and never reach
  // the portal — so Escape is caught here and passed on as a close request.
  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  }

  return (
    <div className="flex h-full flex-col bg-card">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="grid size-9 place-items-center rounded-full bg-primary text-sm font-bold text-card">
          AI
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-base font-bold leading-tight">Trip assistant</h1>
          <p className="text-xs text-muted">Plans with real data from your trip</p>
        </div>
        <button
          type="button"
          onClick={requestClose}
          aria-label="Close assistant"
          className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface"
        >
          {/* An SVG, not the "×" character: a glyph sits on the font's baseline and is never
              quite centred in the circle; drawn lines are. */}
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
            <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto bg-bg px-4 py-4">
        <MessageList messages={messages} status={status} />

        {error && (
          <div className="mt-3 rounded-xl border border-accent/40 bg-card px-3 py-2 text-sm">
            Something went wrong.{" "}
            <button type="button" onClick={() => regenerate()} className="font-semibold text-primary underline">
              Try again
            </button>
          </div>
        )}
      </main>

      <form className="flex gap-2 border-t border-border p-3" onSubmit={onSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your trip…"
          aria-label="Message"
          className="min-w-0 flex-1 rounded-full border border-border bg-bg px-4 py-2 text-sm placeholder:text-muted focus:border-primary focus:outline-none"
        />
        {busy ? (
          <button
            type="button"
            onClick={() => stop()}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-surface"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-card hover:bg-primary-hover disabled:opacity-50"
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
}
