import { anthropic } from "@ai-sdk/anthropic";
import { simulateReadableStream, type LanguageModel } from "ai";
import { MockLanguageModelV4 } from "ai/test";

// Which model answers the chat, from CHAT_MODEL:
//   unset          → claude-haiku-5-5 (needs ANTHROPIC_API_KEY)
//   "mock"         → a fake model with a fixed script — free, offline, predictable;
//                    for building the UI and, later, for tests
//   anything else  → that Anthropic model id, e.g. "claude-sonnet-5-5"
export function chatModel(): LanguageModel {
  const name = process.env.CHAT_MODEL ?? "claude-haiku-5-5";
  return name === "mock" ? mockModel() : anthropic(name);
}

// ---------------------------------------------------------------------------------------
// The mock. A real model decides for itself which tool to call; this one follows a script
// that still runs the whole tool-calling loop for real:
//   1. user asks → on a day page it calls get_day, on a trip page get_trip, else it just talks
//   2. the AI SDK runs the tool (a real request to Spring) and calls the model again
//   3. with the tool result in the prompt, it answers from the real data
// ---------------------------------------------------------------------------------------

type StreamOptions = Parameters<MockLanguageModelV4["doStream"]>[0];
type Prompt = StreamOptions["prompt"];
type StreamPart = { type: string; [key: string]: unknown };

const usage = (out: number) => ({
  inputTokens: { total: 0, noCache: 0, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: out, text: out, reasoning: undefined },
});

/** A text reply, word by word, like real tokens. */
function textReply(text: string) {
  const words = text.split(/(?<= )/);
  return stream([
    { type: "text-start", id: "text-1" },
    ...words.map((delta) => ({ type: "text-delta", id: "text-1", delta })),
    { type: "text-end", id: "text-1" },
    { type: "finish", finishReason: { unified: "stop", raw: undefined }, logprobs: undefined, usage: usage(words.length) },
  ]);
}

/** The model "decides" to call a tool; the SDK runs it and calls the model again. */
function toolCall(toolName: string, input: Record<string, string>) {
  return stream([
    { type: "tool-call", toolCallId: `call-${Date.now()}`, toolName, input: JSON.stringify(input) },
    { type: "finish", finishReason: { unified: "tool-calls", raw: undefined }, logprobs: undefined, usage: usage(1) },
  ]);
}

function stream(chunks: StreamPart[]) {
  return {
    stream: simulateReadableStream({
      initialDelayInMs: 600, // the model "thinking" before the first token
      chunkDelayInMs: 40,
      // The chunks follow the provider stream format; the cast keeps this script readable.
      chunks: chunks as never[],
    }),
  };
}

function systemText(prompt: Prompt): string {
  return prompt.map((m) => (m.role === "system" ? m.content : "")).join("\n");
}

function lastUserText(prompt: Prompt): string {
  const last = [...prompt].reverse().find((m) => m.role === "user");
  if (!last || typeof last.content === "string") return "";
  return last.content.map((part) => (part.type === "text" ? part.text : "")).join(" ").trim();
}

type Day = { dayNumber: number; date: string | null; city: string | null; stopCount: number };
type Stop = { name: string; startTime: string | null };

/** Turns a tool result into a short answer, as a real model would. */
function describeResult(toolName: string, value: unknown): string {
  const v = value as Record<string, unknown>;
  if (toolName === "get_day") {
    const stops = (v.stops as Stop[]) ?? [];
    const list = stops.map((s) => `• ${s.startTime ? s.startTime.slice(0, 5) + " " : ""}${s.name}`).join("\n");
    return `Day ${v.dayNumber}${v.date ? ` (${v.date})` : ""}${v.city ? `, ${v.city}` : ""}: ${
      stops.length ? `${stops.length} stop(s):\n${list}` : "nothing planned yet."
    }`;
  }
  const days = (v.days as Day[]) ?? [];
  const list = days.map((d) => `• Day ${d.dayNumber}${d.city ? ` — ${d.city}` : ""}: ${d.stopCount} stop(s)`).join("\n");
  return `“${v.title}”, ${v.startDate ?? "?"} → ${v.endDate ?? "?"}, ${days.length} day(s):\n${list}`;
}

function mockModel(): LanguageModel {
  return new MockLanguageModelV4({
    doStream: async ({ prompt }: StreamOptions) => {
      const last = prompt[prompt.length - 1];

      // Step 3: a tool has run — answer from its result.
      if (last?.role === "tool") {
        const result = last.content.find((p) => p.type === "tool-result");
        if (!result || result.type !== "tool-result") return textReply("(Test mode) The tool returned nothing.");
        const out = result.output;
        if (out.type === "json") {
          return textReply(`(Test mode — real data from your trip, read with ${result.toolName}.)\n\n${describeResult(result.toolName, out.value)}`);
        }
        const reason = "value" in out && typeof out.value === "string" ? out.value : "unknown error";
        return textReply(`(Test mode) I tried ${result.toolName}, but it failed: ${reason}`);
      }

      // Step 1: pick a tool from the page the user is on.
      const system = systemText(prompt);
      const tripId = system.match(/tripId=([0-9a-f-]{36})/)?.[1];
      const dayId = system.match(/dayId=([0-9a-f-]{36})/)?.[1];
      if (tripId && dayId) return toolCall("get_day", { tripId, dayId });
      if (tripId) return toolCall("get_trip", { tripId });

      return textReply(
        `(Test mode — no real AI is answering.) You asked: “${lastUserText(prompt)}”.\n\n` +
          "Open a trip or one of its days and ask again — I will look it up with my tools.",
      );
    },
  });
}
