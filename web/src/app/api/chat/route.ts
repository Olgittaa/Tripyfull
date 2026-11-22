import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { chatModel } from "@/lib/chatModel";

// Server-only: this file never reaches the browser, so ANTHROPIC_API_KEY (read by the
// provider from the environment) stays on the server.

const INSTRUCTIONS = `You are the trip assistant inside Tripyfull, a travel planning app.
You help the user plan their trip: days, places to see, getting around, flights and stays.

- Answer in the language the user writes in.
- Be concise: short paragraphs or short lists, suited to a small chat panel.
- You cannot see the user's trip yet and you have no live data (flights, opening hours,
  prices). Never invent such facts; say what you would need to check instead.`;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: chatModel(),
    instructions: INSTRUCTIONS,
    messages: await convertToModelMessages(messages),
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
