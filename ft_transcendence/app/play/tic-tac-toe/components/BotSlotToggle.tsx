/**
 * @file BotSlotToggle.tsx
 * @description Toggle component to convert empty slot ↔ bot slot.
 *
 * Allows room owners to add a bot to an empty player slot or remove
 * an existing bot to open the slot for a human player.
 */

"use client";

import { useState } from "react";
import { Bot, User, ChevronDown, Loader2 } from "lucide-react";
import { setBotForSlot, removeBotFromSlot } from "../actions";

interface BotSlotToggleProps {
  /** Room ID for the game */
  roomId: string;
  /** Which role this toggle controls */
  role: "X" | "O";
  /** Whether a bot currently occupies this slot */
  isBot: boolean;
  /** Whether the slot is empty (no human or bot) */
  isEmpty: boolean;
  /** Current bot difficulty if bot is present */
  currentDifficulty?: 1 | 3 | 9;
  /** Disable the toggle (e.g., game in progress) */
  disabled?: boolean;
}

const difficulties = [
  { value: 1 as const, label: "Easy", desc: "Beginner friendly" },
  { value: 3 as const, label: "Medium", desc: "A fair challenge" },
  { value: 9 as const, label: "Hard", desc: "Unbeatable" },
];

export default function BotSlotToggle({
  roomId,
  role,
  isBot,
  isEmpty,
  currentDifficulty = 3,
  disabled = false,
}: BotSlotToggleProps) {
  const [loading, setLoading] = useState(false);
  const [showDifficulty, setShowDifficulty] = useState(false);

  const handleToggleBot = async () => {
    if (disabled || loading) return;

    if (isBot) {
      // Remove bot
      setLoading(true);
      await removeBotFromSlot(roomId);
      setLoading(false);
    } else {
      // Show difficulty selector
      setShowDifficulty(true);
    }
  };

  const handleSetDifficulty = async (difficulty: 1 | 3 | 9) => {
    setLoading(true);
    await setBotForSlot({ roomId, role, difficulty });
    setShowDifficulty(false);
    setLoading(false);
  };

  const handleCancelDifficulty = () => {
    setShowDifficulty(false);
  };

  // Only show for empty slots or existing bot slots
  if (!isEmpty && !isBot) return null;

  return (
    <div className="relative">
      <button
        onClick={handleToggleBot}
        disabled={disabled || loading}
        className={`
          flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all
          ${
            isBot
              ? "bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30"
              : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 border border-white/10"
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isBot ? (
          <>
            <Bot className="h-3 w-3" />
            <span>Remove</span>
          </>
        ) : (
          <>
            <User className="h-3 w-3" />
            <span>Add Bot</span>
            <ChevronDown className="h-3 w-3" />
          </>
        )}
      </button>

      {/* Difficulty dropdown */}
      {showDifficulty && (
        <>
          {/* Backdrop to close on click outside */}
          <div
            className="fixed inset-0 z-10"
            onClick={handleCancelDifficulty}
          />

          <div className="absolute top-full mt-2 left-0 z-20 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-2 min-w-[140px]">
            <div className="text-xs text-white/40 px-2 py-1 mb-1">
              Select Difficulty
            </div>
            {difficulties.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => handleSetDifficulty(value)}
                disabled={loading}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition group disabled:opacity-50"
              >
                <div className="text-sm font-medium text-white group-hover:text-cyan-300 transition">
                  {label}
                </div>
                <div className="text-xs text-white/40">{desc}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
