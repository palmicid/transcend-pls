"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, RotateCcw } from "lucide-react";
import type { XPInfo } from "@/types/progression";

interface XPBarProps {
  xp: XPInfo | { level: number; totalXP: number };
  className?: string;
}

// Logic copied from xpService to run on client
function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level - 1, 1.5));
}

export default function XPBar({ xp, className = "" }: XPBarProps) {
  const [targetOffset, setTargetOffset] = useState(1);

  // Handle both full XPInfo and partial props
  const level = xp.level;
  const total = xp.totalXP;

  const currentThreshold = xpForLevel(level);
  const targetLevel = Math.max(level + 1, level + targetOffset);
  const targetThreshold = xpForLevel(targetLevel);
  const targetSegmentXP = Math.max(1, targetThreshold - currentThreshold);
  const targetProgressXP = Math.max(0, total - currentThreshold);
  const segmentProgressRaw = (targetProgressXP / targetSegmentXP) * 100;
  const segmentProgress = Math.max(0, Math.min(100, Math.round(segmentProgressRaw)));

  return (
    <div className={`w-full ${className}`}>
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <div className="absolute inset-0 bg-fuchsia-500 blur-md opacity-40 group-hover:opacity-60 transition-opacity rounded-full"></div>
                  <div className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-900 border border-fuchsia-500/30 text-white font-bold text-xl sm:text-2xl shadow-inner shadow-fuchsia-500/20">
                    {level}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-white/40" />
                <div className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/30 border border-white/15 text-white/90 font-semibold text-base sm:text-lg">
                  {targetLevel}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white uppercase tracking-wider">
                  Current → Target Level
                </span>
                <span className="text-sm text-fuchsia-200/70 font-medium">
                  {total.toLocaleString()} Total XP
                </span>
              </div>
            </div>

            {/* Progress Text */}
            <div className="text-right hidden sm:block">
              <span className="text-sm font-medium text-white">
                {targetProgressXP.toLocaleString()} <span className="text-white/40">/</span> {targetSegmentXP.toLocaleString()} XP
              </span>
              <div className="text-xs text-fuchsia-400 font-medium mt-0.5">
                {Math.max(0, targetThreshold - total).toLocaleString()} to level {targetLevel}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-wider text-white/50">
            <span>Lv.{level}</span>
            <span>Lv.{targetLevel}</span>
          </div>
          <div className="relative h-4 w-full bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-inner">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${segmentProgress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            {/* Shine effect */}
            <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-b from-white/20 to-transparent mix-blend-overlay"></div>
          </div>

          {/* Mobile Progress Text (shows under bar on small screens) */}
          <div className="flex justify-between items-center sm:hidden mt-2 text-xs">
            <span className="text-white/70">{targetProgressXP.toLocaleString()} / {targetSegmentXP.toLocaleString()} XP</span>
            <span className="text-fuchsia-400 font-medium">{Math.max(0, targetThreshold - total).toLocaleString()} to {targetLevel}</span>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">Target Progress</p>
              <p className="text-sm text-white/85 font-medium">
                Looking ahead to level {targetLevel}
              </p>
              <p className="text-xs text-fuchsia-300/80 mt-0.5">
                {Math.max(0, targetThreshold - total).toLocaleString()} XP remaining
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTargetOffset((prev) => prev + 1)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
              >
                Look Forward
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setTargetOffset(1)}
                disabled={targetOffset === 1}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
