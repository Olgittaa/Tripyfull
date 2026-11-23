import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { chatModel } from "@/lib/chatModel";
import type { PageContext } from "@/lib/portalContext";
import { createTools } from "@/lib/tools";

// Server-only: this file never reaches the browser, so ANTHROPIC_API_KEY (read by the
// provider from the environment) stays on the server.

const BASE_INSTRUCTIONS = `You are the trip assistant inside Tripyfull, a travel planning app.
You help the user plan their trip: days, places to see, getting around, flights and stays.

- Answer in the language the user writes in.
- Be concise: short paragraphs or short lists, suited to a small chat panel.
- For anything about the user's own trip, look it up with your tools first and answer from
  what they return. Never guess the user's plans, dates or bookings.
- You have no live outside data (flight status, opening hours, prices). Never invent such
  facts; say what you would need to check instead.
- Tools take IDs; never show IDs to the user.`;

/** Where the user is in the portal, so "this trip" and "today" mean something. */
function pageInstructions(page: PageContext): string {
  const lines = [`The user is on the "${page.page}" page of the portal.`];
  if (page.tripId) lines.push(`Current trip: tripId=${page.tripId}.`);
  if (page.dayId) lines.push(`Current day: dayId=${page.dayId}.`);
  if (!page.tripId) lines.push("No trip is open on this page.");
  return lines.join("\n");
}

export async function POST(req: Request) {
  const { messages, page }: { messages: UIMessage[]; page?: PageContext } = await req.json();
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "") || null;
  const current: PageContext = page ?? { page: "other", tripId: null, dayId: null };

  const result = streamText({
    model: chatModel(),
    instructions: `${BASE_INSTRUCTIONS}\n\n${pageInstructions(current)}`,
    messages: await convertToModelMessages(messages),
    // The token is bound into the tools here; the model only ever sees tool results.
    tools: createTools(token),
    // Model → tool → model → … : at most 5 rounds per question, so a confused model
    // cannot loop (and spend) forever.
    stopWhen: isStepCount(5),
    // A hard cap per answer: one runaway reply cannot burn the budget.
    maxOutputTokens: 1024,
    // The user closed the panel or pressed stop → the request is aborted → so is the
    // model call, and we stop paying for tokens nobody will read.
    abortSignal: req.signal,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
