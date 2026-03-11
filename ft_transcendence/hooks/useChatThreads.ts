"use client";

import { useMemo, useState } from "react";
import type { ChatThread, Message } from "@/types/chat";
import { makeTitle, uid } from "@/lib/chat/chat.utils";
import { mockThreads } from "@/data/chat.mock";

export function useChatThreads() {
  const [threads, setThreads] = useState<ChatThread[]>(() => mockThreads());
  const [activeId, setActiveId] = useState<string>(() => mockThreads()[0]?.id ?? "t-003");

  const active = useMemo(() => {
    return threads.find((t) => t.id === activeId) ?? threads[0];
  }, [threads, activeId]);

  function createNew() {
    const id = uid();
    const next: ChatThread = { id, title: "New chat", updatedAt: Date.now(), messages: [] };
    setThreads((prev) => [next, ...prev]);
    setActiveId(id);
  }

  function remove(id: string) {
    setThreads((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (filtered.length === 0) {
        const newId = uid();
        const next: ChatThread = { id: newId, title: "New chat", updatedAt: Date.now(), messages: [] };
        setActiveId(newId);
        return [next];
      }
      if (activeId === id) setActiveId(filtered[0].id);
      return filtered;
    });
  }

  function appendUserAndAssistantDraft(threadId: string, userMsg: Message) {
    const assistantDraft: Message = { role: "assistant", content: "" };

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== threadId) return t;

        const nextMessages = [...t.messages, userMsg, assistantDraft];
        return {
          ...t,
          messages: nextMessages,
          title: t.title === "New chat" ? makeTitle(nextMessages) : t.title,
          updatedAt: Date.now(),
        };
      })
    );
  }

  function appendAssistantToken(threadId: string, token: string) {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== threadId) return t;

        const msgs = [...t.messages];
        const last = msgs[msgs.length - 1];
        if (!last || last.role !== "assistant") return t;

        msgs[msgs.length - 1] = { role: "assistant", content: last.content + token };
        return { ...t, messages: msgs, updatedAt: Date.now() };
      })
    );
  }

  function setAssistantError(threadId: string, message: string) {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== threadId) return t;
        const msgs = [...t.messages];
        const last = msgs[msgs.length - 1];
        if (last?.role === "assistant") {
          msgs[msgs.length - 1] = {
            role: "assistant",
            content: last.content.trim().length ? last.content : message,
          };
        } else {
          msgs.push({ role: "assistant", content: message });
        }
        return { ...t, messages: msgs, updatedAt: Date.now() };
      })
    );
  }

  return {
    threads,
    activeId,
    active,
    setActiveId,
    createNew,
    remove,
    appendUserAndAssistantDraft,
    appendAssistantToken,
    setAssistantError,
  };
}
