"use client";

import { motion } from 'framer-motion';
import { 
  Download, Share2, TrendingUp, Target, 
  BarChart3, MapPin, Shield, ChevronRight, Calendar 
} from 'lucide-react';
import { GameAnalysisSurface } from './GameAnalysisSurface';
import { SupportedSport, ShotEvent, ShotResult } from '@/types/goalie-v11';
import { Button } from '@/components/ui/Button';
import { useTheme } from 'next-themes';
import { getSportTerms } from '@/utils/sport-language';

interface GameReportProps {
  sport: SupportedSport;
  opponent: string;
  date: string;
  shots: ShotEvent[];
  stats: {
    totalShots: number;
    saves: number;
    goalsAgainst: number;
    savePercentage: string;
  };
}

export function GameReport({ sport, opponent, date, shots, stats }: GameReportProps) {
  const { theme } = useTheme();
  const terms = getSportTerms(sport);
  const zoneStats = [
    { label: 'Low Slot', saves: 12, goals: 1 },
    { label: 'High Slot', saves: 8, goals: 0 },
    { label: 'Outside Perimeter', saves: 5, goals: 2 },
  ];

  return (
    <div className="max-w-4xl mx-auto bg-card text-foreground rounded-[2.2rem] shadow-2xl border border-border/10 overflow-hidden animate-in fade-in duration-700 backdrop-blur-3xl">
      {/* 1. Header & Quick Actions */}
      <div className="p-10 pb-6 flex justify-between items-start bg-foreground/[0.02] border-b border-border/5">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[.25em] text-[10px] mb-3">
            <TrendingUp size={16} /> Performance Analytics Report
          </div>
          <h2 className="text-5xl font-black uppercase tracking-tighter leading-none mb-4">
            vs {opponent}
          </h2>
          <div className="flex items-center gap-6 text-muted-foreground font-bold text-[10px] uppercase tracking-widest">
             <span className="flex items-center gap-2 text-foreground/80"><Calendar size={14} className="text-primary/60" /> {new Date(date).toLocaleDateString()}</span>
             <span className="flex items-center gap-2 text-foreground/80"><MapPin size={14} className="text-primary/60" /> Shark Tank Arena</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" className="bg-foreground/5 rounded-full w-12 h-12 p-0 text-foreground hover:bg-foreground/10 border border-border/5"><Share2 size={20} /></Button>
          <Button variant="ghost" className="bg-foreground/5 rounded-full w-12 h-12 p-0 text-foreground hover:bg-foreground/10 border border-border/5"><Download size={20} /></Button>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 p-10">
        {[
          { label: 'Save %', value: stats.savePercentage, icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
          { label: 'Total Shots', value: stats.totalShots, icon: Target, color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'Total Saves', value: stats.saves, icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
          { label: 'Goals Against', value: stats.goalsAgainst, icon: BarChart3, color: 'text-red-500', bg: 'bg-red-500/5' },
        ].map((metric) => (
          <div key={metric.label} className={`${metric.bg} border border-border/10 rounded-2xl p-6 transition-all hover:border-border/20 shadow-inner`}>
             <div className="flex items-center justify-between mb-4">
                <metric.icon size={16} className={metric.color} />
                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest leading-none">{metric.label}</span>
             </div>
             <div className="text-3xl font-black">{metric.value}</div>
          </div>
        ))}
      </div>

      {/* 3. The Visual Shot Chart */}
      <div className="px-10 space-y-16 mb-16">
        {/* Support up to 5 segments (H1, H2, ET1, ET2, PKs for soccer | Q1-Q4, OT for lax) */}
        {Array.from({ length: 5 }).map((_, i) => {
          const periodNum = i + 1;
          const periodShots = shots.filter(s => s.period === periodNum);
          if (periodShots.length === 0) return null;
          
          return (
            <div key={periodNum} className="space-y-8">
              <div className="flex items-center justify-between border-b border-border/10 pb-4">
                 <h3 className="text-base font-black uppercase tracking-[.4em] flex items-center gap-3">
                    {sport === 'soccer' ? (
                       periodNum === 1 ? 'Half 1' : 
                       periodNum === 2 ? 'Half 2' : 
                       periodNum === 3 ? 'Extra Time 1' : 
                       periodNum === 4 ? 'Extra Time 2' : 'Penalty Kicks'
                    ) : (
                       periodNum > (sport.includes('lacrosse') ? 4 : 3) ? 'Overtime' : `${terms.period} ${periodNum}`
                    )}
                 </h3>
                 <div className="text-[10px] font-black text-primary uppercase tracking-[.2em]">
                    {periodShots.length} Detections Recorded
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    <MapPin size={14} className="text-primary" /> Surface Map Distribution
                  </div>
                  <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-border/10 bg-black shadow-2xl relative ring-1 ring-white/5">
                    <GameAnalysisSurface 
                      sport={sport}
                      view="field"
                      interactive={false}
                      shots={periodShots}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    <Target size={14} className="text-primary" /> Net Perspective Analysis
                  </div>
                  <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-border/10 bg-black shadow-2xl relative ring-1 ring-white/5">
                    <GameAnalysisSurface 
                      sport={sport}
                      view="net"
                      interactive={false}
                      shots={periodShots}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Advanced Performance Metrics */}
      <div className="px-10 py-12 bg-foreground/[0.01] border-t border-border/10">
        <h3 className="text-sm font-black uppercase tracking-widest mb-10 flex items-center gap-3">
           <BarChart3 size={20} className="text-primary" /> Advanced Shot Origin Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
          {zoneStats.map((zone) => {
            const perc = Math.round((zone.saves / (zone.saves + zone.goals)) * 100);
            return (
              <div key={zone.label} className="group">
                <div className="flex justify-between items-end mb-3">
                   <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{zone.label}</div>
                   <div className="text-[10px] font-mono font-black text-primary">{perc}% Mastery</div>
                </div>
                <div className="h-2 w-full bg-foreground/5 rounded-full overflow-hidden border border-border/5">
                   <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${perc}%` }}
                    className={`h-full rounded-full ${perc > 85 ? 'bg-emerald-400' : 'bg-primary'} shadow-[0_0_15px_rgba(var(--primary),0.3)]`}
                   />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. AI Coach OS Integration */}
      <div className="m-10 p-10 bg-primary/[0.03] border border-primary/20 rounded-[2.5rem] flex items-center gap-10 shadow-2xl shadow-primary/5 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={120} />
         </div>
         <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center text-black shrink-0 shadow-2xl shadow-primary/20 transition-transform group-hover:scale-105">
            <TrendingUp size={48} />
         </div>
         <div className="flex-1">
            <h4 className="text-3xl font-black tracking-tighter text-foreground mb-3">Coach OS Update</h4>
            <p className="text-base text-muted-foreground font-medium leading-relaxed max-w-2xl">
              Based on the goals analyzed from the <strong className="text-foreground">Inside Arc</strong>, your next training protocol has been updated to include <strong className="text-foreground">Lateral Reaction</strong> and <strong className="text-foreground">High-to-Low Recovery</strong> progressions.
            </p>
         </div>
         <Button variant="ghost" className="text-primary hover:text-black hover:bg-primary rounded-full w-14 h-14 p-0 shadow-xl border border-primary/20 transition-all">
            <ChevronRight size={28} />
         </Button>
      </div>

      {/* Footer */}
      <div className="px-10 py-10 flex items-center justify-center gap-2 text-center text-[10px] text-zinc-600 font-bold uppercase tracking-[.5em] mb-4">
        <img 
            src="/flower-logo.png?v=5" 
            alt="CIC Logo" 
            width={16} 
            height={16} 
            draggable={false}
            className="object-contain pointer-events-none select-none"
            style={{ filter: theme === 'dark' ? 'invert(1)' : 'none' }}
        />
        Goalie Card — Precision Athletic Intelligence 
      </div>
    </div>
  );
}
