"use client";

export function Composer({
  input,
  setInput,
  loading,
  onSend,
  onStop,
}: {
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
  onSend: () => void;
  onStop: () => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-3">
      <div className="flex items-end gap-2">
        <textarea
          className="flex-1 resize-none rounded-2xl bg-black/20 border border-white/10 px-4 py-3 outline-none focus:border-white/20 focus:bg-black/30 transition text-sm"
          rows={2}
          placeholder="Send a message… (Enter to send, Shift+Enter for newline)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />

        {!loading ? (
          <button
            onClick={onSend}
            className="shrink-0 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-zinc-950 hover:opacity-90 transition"
          >
            Send
          </button>
        ) : (
          <button
            onClick={onStop}
            className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
          >
            Stop
          </button>
        )}
      </div>

      <div className="mt-2 text-[13px] text-white/50 px-1 flex items-center gap-1">
		Powered by <span className="text-white/70"> Local LLM via Ollama 🦙</span>
	  </div>

    </div>
  );
}
