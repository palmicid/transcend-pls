"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";

interface GameRoomShellProps {
  roomId: string;
  gameType: string;
  isConnected: boolean;
  myRole: string | null;
  onLeave: () => void;
  connectionError?: string | null;
  children: ReactNode;
}

export default function GameRoomShell({
  roomId,
  gameType,
  isConnected,
  myRole,
  onLeave,
  connectionError,
  children,
}: GameRoomShellProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/play/${gameType}`}
            className="rounded-2xl border border-white/10 bg-white/5 p-2 hover:bg-white/15 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Room: {roomId}
            </h1>
            <div className="flex items-center gap-2 text-sm text-white/60 mt-1">
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "bg-emerald-400" : "bg-red-400"
                }`}
              />
              {isConnected ? "Connected" : "Connecting..."}
              {myRole && (
                <>
                  <span>•</span>
                  <span>
                    You are{" "}
                    <span className="text-cyan-400 font-semibold">{myRole}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onLeave}
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Leave
        </button>
      </div>

      {connectionError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {connectionError}
        </div>
      )}

      {/* Main Game Area */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto space-y-6">{children}</div>
      </div>
    </div>
  );
}
