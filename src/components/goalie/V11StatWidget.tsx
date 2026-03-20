"use client";

import { motion } from 'framer-motion';
import { TrendingUp, Activity } from 'lucide-react';
import { getSportTerms } from '@/utils/sport-language';
import { SupportedSport } from '@/types/goalie-v11';

interface V11StatWidgetProps {
  score: number;
  label?: string;
  sport?: SupportedSport;
  stats: { label: string; value: string | number }[];
  className?: string;
}

export function V11StatWidget({ score, label, sport, stats, className }: V11StatWidgetProps) {
  const displayLabel = label || (sport ? `${getSportTerms(sport).surface} Performance` : "Performance");
  return (
    <div className={`glass rounded-[2rem] p-8 border border-border/50 relative overflow-hidden flex flex-col items-center justify-center gap-8 ${className}`}>
      {/* Sport Label & Category */}
      <div className="absolute top-6 left-8 pointer-events-none flex flex-col items-start gap-1">
        <span className="text-[10px] font-black uppercase tracking-[.2em] text-muted-foreground opacity-50">
          {sport?.includes('lacrosse') ? 'LACROSSE' : sport?.replace('-', ' ') || 'Goalie'}
        </span>
        <span className="text-[10px] font-bold text-foreground">
          {displayLabel}
        </span>
      </div>

      {/* V11 Score Ring */}
      <div className="relative w-32 h-32 mt-4">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
          <circle
            cx="64"
            cy="64"
            r="60"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-muted/10"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="60"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={377}
            initial={{ strokeDashoffset: 377 }}
            animate={{ strokeDashoffset: 377 - (377 * score) / 100 }}
            transition={{ duration: 1.5, ease: "circOut" }}
            className="text-foreground"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-foreground tracking-tighter leading-none">{score}</span>
          <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[.2em] mt-1">Index</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 w-full border-t border-border/50 pt-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex flex-col items-center text-center">
            <span className="text-xl font-black text-foreground whitespace-nowrap">{stat.value}</span>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider leading-tight mt-1">{stat.label}</span>
          </div>
        ))}
      </div>
      
      {/* Action Hint */}
      <div className="w-full">
        <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-xl border border-border/50">
           <div className="flex items-center gap-2">
              <Activity size={12} className="text-primary" />
              <span className="text-[10px] font-bold text-foreground">Protocol Active</span>
           </div>
           <TrendingUp size={12} className="text-green-500" />
        </div>
      </div>
    </div>
  );
}
