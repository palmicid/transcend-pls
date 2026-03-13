"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import * as LucideIcons from "lucide-react";
import type { UserAchievementInfo } from "@/types/progression";

interface AchievementGridProps {
  achievements: UserAchievementInfo[];
  className?: string;
}

export function AchievementGrid({ achievements, className = "" }: AchievementGridProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {achievements.map((achievement, i) => {
        const isUnlocked = !!achievement.unlockedAt;
        // Dynamically resolve icon from Lucide
        const IconComponent = (LucideIcons as any)[achievement.icon] || LucideIcons.Trophy;

        return (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`
              relative p-4 rounded-xl border flex flex-col items-center text-center overflow-hidden transition-all
              ${isUnlocked 
                ? "bg-slate-800/60 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:border-indigo-400/50 hover:bg-slate-800/80" 
                : "bg-slate-900/40 border-slate-800/50 grayscale opacity-60 flex items-center justify-center"}
            `}
          >
            {/* Background glow if unlocked */}
            {isUnlocked && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl -z-10"></div>
            )}

            <div className={`p-3 rounded-full mb-3 ${isUnlocked ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
              <IconComponent size={24} strokeWidth={isUnlocked ? 2 : 1.5} />
            </div>

            <h4 className={`font-semibold text-sm mb-1 ${isUnlocked ? 'text-slate-200' : 'text-slate-400'}`}>
              {achievement.name}
            </h4>
            
            <p className={`text-xs ${isUnlocked ? 'text-slate-400' : 'text-slate-500'}`}>
              {achievement.description}
            </p>

            {isUnlocked && achievement.unlockedAt && (
              <span className="text-[10px] text-indigo-400/80 mt-3 font-medium uppercase tracking-wider">
                {format(new Date(achievement.unlockedAt), "MMM d, yyyy")}
              </span>
            )}
            
            {!isUnlocked && (
              <LucideIcons.Lock size={12} className="absolute top-3 right-3 text-slate-600" />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
