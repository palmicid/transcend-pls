/**
 * @file components/game/room/PlayerSlotCard.tsx
 */

"use client";

import { User, Wifi, WifiOff, Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface PlayerSlotCardProps {
  role: string;
  roleIcon: ReactNode;
  player?: {
    displayName: string;
    isConnected: boolean;
    isBot?: boolean;
  };
  isCurrentTurn: boolean;
  isMe: boolean;
  colorClasses: {
    bg: string;
    border: string;
    text: string;
  };
}

export default function PlayerSlotCard({
  role,
  roleIcon,
  player,
  isCurrentTurn,
  isMe,
  colorClasses,
}: PlayerSlotCardProps) {
  return (
    <div
      className={`
        rounded-2xl border p-4 ${colorClasses.bg} ${colorClasses.border}
        ${isCurrentTurn ? "ring-2 ring-white/30" : ""}
        ${isMe ? "ring-1 ring-white/20" : ""}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {roleIcon}
          <span className={`font-semibold ${colorClasses.text}`}>{role}</span>
          {isMe && (
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/70">
              You
            </span>
          )}
        </div>
        {player && (
          <span className="flex items-center gap-1 text-xs">
            {player.isBot ? (
              <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-white/50">BOT</span>
            ) : player.isConnected ? (
              <Wifi className="h-3 w-3 text-emerald-400" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-400" />
            )}
          </span>
        )}
      </div>
      {player ? (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-white/50" />
          <span className="text-sm text-white truncate">{player.displayName}</span>
        </div>
      ) : (
        <div className="text-sm text-white/40 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Waiting...
        </div>
      )}
      {isCurrentTurn && (
        <div className={`mt-2 text-xs font-medium ${isMe ? "text-emerald-300" : "text-amber-300"}`}>
          {isMe ? "→ Your turn!" : "← Playing..."}
        </div>
      )}
    </div>
  );
}
