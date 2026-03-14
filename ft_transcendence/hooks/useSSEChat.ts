"use client";

import { useRef } from "react";
import { safeParseSSEToken } from "@/lib/chat/chat.utils";

export function useSSEChat() {
  const abortRef = useRef<AbortController | null>(null);

  async function streamReply({
    prompt,
    onToken,
  }: {
    prompt: string;
    onToken: (token: string) => void;
  }) {
    abortRef.current?.abort();

    const ac = new AbortController();
    abortRef.current = ac;

    const res = await fetch("/api/llm/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
      signal: ac.signal,
    });

    if (res.status === 429) {
      const data = await res.json();
      throw new Error(`RATE_LIMIT:${data.retryAfter}`);
    }

    if (!res.ok && res.status !== 499) {
      throw new Error("SERVER_ERROR");
    }

    if (!res.body) throw new Error("No response body");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          const token = safeParseSSEToken(line);
          if (token) onToken(token);
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        return;
      }

      throw err;
    }
  }

  function cancel() {
    abortRef.current?.abort();
  }

  return { streamReply, cancel };
}
