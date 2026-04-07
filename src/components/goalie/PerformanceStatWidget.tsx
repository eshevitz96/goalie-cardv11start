"use client";

import { motion } from 'framer-motion';
import { Play, CheckCircle, Activity } from 'lucide-react';
import { getSportTerms } from '@/utils/sport-language';
import { SupportedSport } from '@/types/goalie-v11';
import { ScoreWidgetSkeleton } from '@/components/ui/Skeletons';

interface PerformanceStatWidgetProps {
  score: number;
  label?: string;
  sport?: SupportedSport;
  stats: { label: string; value: string | number }[];
  className?: string;
  isLoading?: boolean;
  delta?: number | null;
  snapshotLabel?: string | null;
  onEmptyClick?: () => void; // optional — fires when play button clicked with no data
}

export function PerformanceStatWidget({
  score, label, sport, stats, className,
  isLoading, delta, snapshotLabel, onEmptyClick
}: PerformanceStatWidgetProps) {
  if (isLoading) return <ScoreWidgetSkeleton />;

  const displayLabel = label || (sport ? `${getSportTerms(sport).surface} Performance` : "Performance");
  const hasScore = score > 0;

  const hasDelta = delta !== null && delta !== undefined;
  const deltaPositive = hasDelta && delta! > 0;
  const deltaZero = hasDelta && Math.abs(delta!) < 0.5;

  // Normalize snapshotLabel for display
  const isCompleted = snapshotLabel?.toLowerCase().includes('complet');

  return (
    <div className={`glass rounded-[2rem] p-8 border border-border/50 relative overflow-hidden flex flex-col items-center justify-center gap-8 ${className}`}>

      {/* Sport label */}
      <div className="absolute top-6 left-8 pointer-events-none flex flex-col items-start gap-1">
        <span className="text-[10px] font-black uppercase tracking-[.2em] text-muted-foreground opacity-50">
          {sport?.includes('lacrosse') ? 'LACROSSE' : sport?.replace('-', ' ') || 'Goalie'}
        </span>
        <span className="text-[10px] font-bold text-foreground">{displayLabel}</span>
      </div>

      {/* Delta badge */}
      {hasDelta && !deltaZero && (
        <div className={`absolute top-6 right-8 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest ${
          deltaPositive
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {deltaPositive ? '+' : ''}{delta!.toFixed(1)}
        </div>
      )}
      {hasDelta && deltaZero && (
        <div className="absolute top-6 right-8 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest bg-muted/30 text-muted-foreground border border-border/50">
          ±0
        </div>
      )}

      {/* Score ring */}
      <div className="relative w-32 h-32 mt-4">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8"
            fill="transparent" className="text-muted/10" />
          <motion.circle
            cx="64" cy="64" r="60"
            stroke="currentColor" strokeWidth="8" fill="transparent"
            strokeDasharray={377}
            initial={{ strokeDashoffset: 377 }}
            animate={{ strokeDashoffset: hasScore ? 377 - (377 * score) / 100 : 377 }}
            transition={{ duration: 1.5, ease: "circOut" }}
            className={hasScore ? "text-foreground" : "text-muted/20"}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hasScore ? (
            <>
              <motion.span
                key={score}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-4xl font-black text-foreground tracking-tighter leading-none"
              >
                {score}
              </motion.span>
              <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[.2em] mt-1">Index</span>
            </>
          ) : (
            // Empty state — play button invites engagement, no text
            <motion.button
              onClick={onEmptyClick}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex items-center justify-center w-12 h-12 rounded-full border border-border/60 bg-muted/20 text-muted-foreground/50 hover:border-foreground/30 hover:text-foreground/60 transition-colors cursor-pointer"
            >
              <Play size={16} fill="currentColor" className="ml-0.5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 w-full border-t border-border/50 pt-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex flex-col items-center text-center">
            <span className={`text-xl font-black whitespace-nowrap ${
              stat.value === '0' || stat.value === 0 || stat.value === '.000'
                ? 'text-muted-foreground/40' : 'text-foreground'
            }`}>
              {stat.value}
            </span>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider leading-tight mt-1">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className="w-full">
        <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            {isCompleted
              ? <CheckCircle size={12} className="text-emerald-500" />
              : <Activity size={12} className="text-primary" />
            }
            <span className="text-[10px] font-bold text-foreground">
              {isCompleted
                ? 'Completed'
                : (snapshotLabel || (hasScore ? 'Protocol Active' : 'Ready to track'))
              }
            </span>
          </div>
          {hasScore
            ? <span className={`text-[9px] font-black ${deltaPositive ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                {hasDelta && !deltaZero ? (deltaPositive ? `+${delta!.toFixed(1)}` : `${delta!.toFixed(1)}`) : '—'}
              </span>
            : <span className="text-[9px] text-muted-foreground/40">—</span>
          }
        </div>
      </div>
    </div>
  );
}
