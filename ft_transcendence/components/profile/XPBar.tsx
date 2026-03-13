"use client";

import { motion } from "framer-motion";
import type { XPInfo } from "@/types/progression";

interface XPBarProps {
  xp: XPInfo;
  className?: string;
}

export function XPBar({ xp, className = "" }: XPBarProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {/* Level Badge */}
          <div className="relative group">
            <div className="absolute inset-0 bg-fuchsia-500 blur-md opacity-40 group-hover:opacity-60 transition-opacity rounded-full"></div>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border border-indigo-500/30 text-white font-bold text-lg shadow-inner">
              {xp.level}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Level
            </span>
            <span className="text-xs text-slate-400">
              {xp.totalXP} Total XP
            </span>
          </div>
        </div>

        {/* Progress Text */}
        <div className="text-right">
          <span className="text-sm font-medium text-slate-300">
            {xp.currentLevelXP} <span className="text-slate-500">/</span> {xp.currentLevelXP + xp.nextLevelXP} XP
          </span>
          <div className="text-xs text-indigo-400 font-medium">
            {xp.nextLevelXP} to next level
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 w-full bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-pink-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${xp.progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        {/* Shine effect */}
        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-b from-white/20 to-transparent mix-blend-overlay"></div>
      </div>
    </div>
  );
}
