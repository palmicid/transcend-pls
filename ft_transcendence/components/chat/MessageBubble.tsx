"use client";

import type { Message } from "@/types/chat";

export function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={[
          "max-w-[85%] sm:max-w-[75%] rounded-3xl px-4 py-3 whitespace-pre-wrap leading-relaxed text-sm",
          isUser
            ? "bg-white text-zinc-950"
            : "border border-white/10 bg-white/[0.04] backdrop-blur-xl text-white",
        ].join(" ")}
      >
        {msg.content}
      </div>
    </div>
  );
}
