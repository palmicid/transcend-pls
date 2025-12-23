"use client";

export function ChatHeader({
  title,
  onNewMobile,
}: {
  title: string;
  onNewMobile: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-lg font-semibold truncate">{title}</div>
        <div className="text-xs text-white/55 mt-0.5">AI Assistant</div>
      </div>

      <button
        onClick={onNewMobile}
        className="lg:hidden rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
      >
        New
      </button>
    </div>
  );
}
