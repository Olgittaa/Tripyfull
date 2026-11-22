import { anthropic } from "@ai-sdk/anthropic";
import { simulateReadableStream, type LanguageModel } from "ai";
import { MockLanguageModelV4 } from "ai/test";

// Which model answers the chat, from CHAT_MODEL:
//   unset          → claude-haiku-5-5 (needs ANTHROPIC_API_KEY)
//   "mock"         → a fake model that streams a canned reply — free, offline, predictable;
//                    for building the UI and, later, for tests
//   anything else  → that Anthropic model id, e.g. "claude-sonnet-5-5"
export function chatModel(): LanguageModel {
  const name = process.env.CHAT_MODEL ?? "claude-haiku-5-5";
  return name === "mock" ? mockModel() : anthropic(name);
}

type Prompt = Parameters<MockLanguageModelV4["doStream"]>[0]["prompt"];

/** The text of the user's latest message, so the mock can echo it back. */
function lastUserText(prompt: Prompt): string {
  const last = [...prompt].reverse().find((m) => m.role === "user");
  if (!last || typeof last.content === "string") return "";
  return last.content.map((part) => (part.type === "text" ? part.text : "")).join(" ").trim();
}

function mockModel(): LanguageModel {
  return new MockLanguageModelV4({
    doStream: async ({ prompt }) => {
      const question = lastUserText(prompt);
      const reply =
        `(Test mode — no real AI is answering.) You asked: “${question}”.\n\n` +
        "Once a real model is connected I will answer here, word by word, just like this. " +
        "Later I will also see your trip and look up flights and places before suggesting anything.";

      // Split into words so the reply arrives piece by piece, like real tokens.
      const words = reply.split(/(?<= )/);
      return {
        stream: simulateReadableStream({
          initialDelayInMs: 600, // the model "thinking" before the first token
          chunkDelayInMs: 40,
          chunks: [
            { type: "text-start" as const, id: "text-1" },
            ...words.map((delta) => ({ type: "text-delta" as const, id: "text-1", delta })),
            { type: "text-end" as const, id: "text-1" },
            {
              type: "finish" as const,
              finishReason: { unified: "stop" as const, raw: undefined },
              logprobs: undefined,
              usage: {
                inputTokens: { total: 0, noCache: 0, cacheRead: undefined, cacheWrite: undefined },
                outputTokens: { total: words.length, text: words.length, reasoning: undefined },
              },
            },
          ],
        }),
      };
    },
  });
}
