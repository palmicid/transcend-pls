import type { ChatThread } from "@/types/chat";

export function mockThreads(): ChatThread[] {
  const now = Date.now();

  return [
    {
      id: "t-001",
      title: "How to win Tic-Tac-Toe?",
      updatedAt: now - 1000 * 60 * 8,
      messages: [
        { role: "user", content: "Any tip to win tic-tac-toe fast?" },
        {
          role: "assistant",
          content:
            "Try the center first. If you get it, you can create forks (two winning lines).",
        },
      ],
    },
    {
      id: "t-002",
      title: "Explain SSE streaming",
      updatedAt: now - 1000 * 60 * 40,
      messages: [
        { role: "user", content: "How does streaming response work (SSE)?" },
        {
          role: "assistant",
          content:
            "Server sends incremental chunks as `data:` lines. Client reads with `ReadableStream.getReader()` and appends tokens.",
        },
      ],
    },
    {
      id: "t-003",
      title: "New chat",
      updatedAt: now - 1000 * 10,
      messages: [],
    },
  ];
}
