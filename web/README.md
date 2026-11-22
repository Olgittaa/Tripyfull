# Tripyfull assistant (`web/`)

The AI trip-planning chat. A Next.js + TypeScript app that the Vue portal (`../frontend`)
shows in an iframe panel behind a floating button. Architecture: see the root `CLAUDE.md`.

```bash
cp .env.example .env.local
npm install
npm run dev        # http://localhost:3000
```

Only the portal origin (`NEXT_PUBLIC_PORTAL_ORIGIN`) may embed the app
(`Content-Security-Policy: frame-ancestors`, set in `next.config.ts`).

## postMessage contract

| Direction | Message | Meaning |
|---|---|---|
| chat → portal | `{ type: "tripyfull-chat:close" }` | the user closed the chat from inside the panel |
