"use client";

import type { ChatThread } from "@/types/chat";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { Composer } from "@/components/chat/Composer";

export function ChatPanel({
  thread,
  loading,
  input,
  setInput,
  onSend,
  onStop,
  onNewMobile,
  bottomRef,
}: {
  thread: ChatThread;
  loading: boolean;
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  onNewMobile: () => void;
  bottomRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <ChatHeader title={thread.title} onNewMobile={onNewMobile} />
      </div>

      <div className="h-[62vh] sm:h-[68vh] overflow-y-auto p-4 sm:p-6 space-y-4">
        {thread.messages.length ? (
          thread.messages.map((m, i) => <MessageBubble key={i} msg={m} />)
        ) : (
          <div className="text-white/60 text-sm">Start a conversation ✨</div>
        )}

        {loading ? (
          <div className="flex justify-start">
            <div className="border border-white/10 bg-white/[0.04] backdrop-blur-xl text-white rounded-3xl px-4 py-3 text-sm">
              typing…
            </div>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-white/10">
        <Composer
          input={input}
          setInput={setInput}
          loading={loading}
          onSend={onSend}
          onStop={onStop}
        />
      </div>
    </section>
  );
}
