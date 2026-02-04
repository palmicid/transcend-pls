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
    /**
     * @file BotSlotToggle.tsx
     * @description Re-export shared BotSlotToggle component.
     */

    export { default } from "@/components/game/BotSlotToggle";
          ${
