"use client";

// The whole chat window as the portal shows it in its iframe panel.
// Step 1: layout only. Messages and streaming arrive in step 2.

const portalOrigin = process.env.NEXT_PUBLIC_PORTAL_ORIGIN ?? "http://localhost:5173";

/** Asks the portal to close the panel. Only the portal's origin may receive it. */
function requestClose() {
  if (window.parent !== window) {
    window.parent.postMessage({ type: "tripyfull-chat:close" }, portalOrigin);
  }
}

export default function ChatPanel() {
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
          className="grid size-9 place-items-center rounded-full text-xl text-muted hover:bg-surface"
        >
          ×
        </button>
      </header>

      <main className="flex-1 space-y-3 overflow-y-auto bg-bg px-4 py-4">
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-card px-4 py-3 text-sm shadow-sm">
          Hi! I&apos;m your trip assistant. Soon I&apos;ll see the page you&apos;re on and help you plan
          days, places and flights.
        </div>
      </main>

      <form className="flex gap-2 border-t border-border p-3" onSubmit={(e) => e.preventDefault()}>
        <input
          disabled
          placeholder="The chat is coming in the next step…"
          className="min-w-0 flex-1 rounded-full border border-border bg-bg px-4 py-2 text-sm placeholder:text-muted disabled:opacity-70"
        />
        <button
          type="submit"
          disabled
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-card hover:bg-primary-hover disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
