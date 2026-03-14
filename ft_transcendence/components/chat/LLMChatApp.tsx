"use client";

import { useRef, useState } from "react";
import type { Message } from "@/types/chat";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useChatThreads } from "@/hooks/useChatThreads";
import { useSSEChat } from "@/hooks/useSSEChat";

export default function LLMChatApp() {
  const {
    activeId,
    active,
    createNew,
    appendUserAndAssistantDraft,
    appendAssistantToken,
    setAssistantError,
  } = useChatThreads();

  const { streamReply, cancel } = useSSEChat();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

  async function onSend() {
    if (loading) return;

    const text = input.trim();
    if (!text) return;

    setInput("");
    setLoading(true);

    const userMsg: Message = {
      role: "user",
      content: text,
    };

    appendUserAndAssistantDraft(activeId, userMsg);

    try {
      await streamReply({
        prompt: text,
        onToken: (token) => {
          appendAssistantToken(activeId, token);
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        },
      });
    } catch (err: any) {
      if (err.message.startsWith("RATE_LIMIT")) {
        const seconds = err.message.split(":")[1];
        const msg = `Too many requests. Try again in ${seconds}s`;

        setError(msg);
        setAssistantError(activeId, msg);
      } else {
        setError("Sorry — something went wrong.");
        setAssistantError(activeId, "Sorry — something went wrong.");
      }
    } finally {
      setLoading(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  function onStop() {
    cancel();
    setLoading(false);
  }

  if (!active) return null;

  return (
    <div className="w-full h-screen">
      <ChatPanel
        thread={active}
        loading={loading}
        input={input}
        setInput={setInput}
        onSend={onSend}
        onStop={onStop}
        onNewMobile={createNew}
        bottomRef={bottomRef}
        error={error}
      />
    </div>
  );
}
