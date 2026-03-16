"use client";

import { useState } from "react";
import { Bot, Play, Zap, Shield, Swords } from "lucide-react";

interface DifficultyOption {
  value: string;
  label: string;
  icon: typeof Shield;
  desc: string;
}

interface PlayVsBotCardProps {
  onPlayBot: (difficulty: string) => Promise<void>;
  loading: boolean;
  disabled?: boolean;
}

export default function PlayVsBotCard({
  onPlayBot,
  loading,
  disabled = false,
}: PlayVsBotCardProps) {
  const [difficulty, setDifficulty] = useState<string>("Medium");

  const difficulties: DifficultyOption[] = [
    { value: "Easy", label: "Easy", icon: Shield, desc: "Great for learning" },
    { value: "Medium", label: "Medium", icon: Swords, desc: "Balanced challenge" },
    { value: "Hard", label: "Hard", icon: Zap, desc: "Maximum difficulty" },
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 h-full">
      <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2 mb-1">
        <Bot className="h-5 w-5 text-fuchsia-400" />
        Play vs Bot
      </h2>
      <p className="text-sm text-white/50 mb-6">
        Practice against AI at your own pace
      </p>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {difficulties.map((diff) => {
          const Icon = diff.icon;
          const isSelected = difficulty === diff.value;
          return (
            <button
              key={diff.value}
              onClick={() => setDifficulty(diff.value)}
              disabled={disabled}
              className={`w-full flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl border transition text-center ${
                isSelected
                  ? "border-fuchsia-500/40 bg-fuchsia-500/10"
                  : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-fuchsia-400" : "text-white/30"}`} />
              <div className="min-w-0">
                <span className={`block text-xs sm:text-sm font-medium ${isSelected ? "text-white" : "text-white/50"}`}>
                  {diff.label}
                </span>
                <span className={`hidden sm:block text-[11px] ${isSelected ? "text-fuchsia-400/60" : "text-white/20"}`}>
                  {diff.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPlayBot(difficulty)}
        disabled={loading || disabled}
        className="w-full rounded-2xl bg-white text-zinc-950 hover:opacity-90 px-4 py-2.5 font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Play className="h-4 w-4 fill-current" />
        {loading ? "Starting…" : "Start Game"}
      </button>
    </div>
  );
}
