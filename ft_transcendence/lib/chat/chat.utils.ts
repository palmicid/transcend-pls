import type { Message } from "@/types/chat";

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function makeTitle(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === "user")?.content?.trim();
  if (!firstUser) return "New chat";
  return firstUser.length > 32 ? firstUser.slice(0, 32) + "…" : firstUser;
}

export function safeParseSSEToken(line: string): string | null {
  if (!line.startsWith("data:")) return null;

  const json = line.replace("data:", "").trim();
  if (!json || json === "[DONE]") return null;

  try {
    const parsed: unknown = JSON.parse(json);
    // expected: { choices: [{ delta: { content: string } }] }
    if (typeof parsed !== "object" || parsed === null) return null;

    const choices = (parsed as { choices?: unknown }).choices;
    if (!Array.isArray(choices) || choices.length === 0) return null;

    const delta = (choices[0] as { delta?: unknown }).delta;
    if (typeof delta !== "object" || delta === null) return null;

    const content = (delta as { content?: unknown }).content;
    return typeof content === "string" && content.length > 0 ? content : null;
  } catch {
    return null;
  }
}
