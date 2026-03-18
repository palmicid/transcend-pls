"use client";

import { useRef, useState } from "react";
import type { Message } from "@/types/chat";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useChatThreads } from "@/hooks/useChatThreads";
import { useSSEChat } from "@/hooks/useSSEChat";

export default function LLMChatApp() {
  const {
    threads,
    activeId,
    active,
    setActiveId,
    createNew,
    remove,
    appendUserAndAssistantDraft,
    appendAssistantToken,
    setAssistantError,
  } = useChatThreads();

  const { streamReply, cancel } = useSSEChat();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function onSend() {
    if (loading) return;
    const text = input.trim();
    if (!text) return;

    setInput("");
    setLoading(true);

    const userMsg: Message = { role: "user", content: text };
    appendUserAndAssistantDraft(activeId, userMsg);

    try {
      await streamReply({
        prompt: text,
        onToken: (token) => {
          appendAssistantToken(activeId, token);
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        },
      });
    } catch {
      setAssistantError(activeId, "Sorry — something went wrong. Please try again.");
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
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 pb-12">
        <Sidebar
          threads={threads}
          activeId={activeId}
          onNew={createNew}
          onSelect={setActiveId}
          onDelete={remove}
        />

        <ChatPanel
          thread={active}
          loading={loading}
          input={input}
          setInput={setInput}
          onSend={onSend}
          onStop={onStop}
          onNewMobile={createNew}
          bottomRef={bottomRef}
        />
      </div>
    </div>
  );
}
