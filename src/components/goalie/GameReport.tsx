"use client";

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { 
  Download, Share2, TrendingUp, Target, 
  BarChart3, MapPin, Shield, ChevronRight, Calendar, Film, Maximize2, Edit2
} from 'lucide-react';
import { GameAnalysisSurface } from './GameAnalysisSurface';
import { SupportedSport, ShotEvent, ShotResult } from '@/types/goalie-v11';
import { Button } from '@/components/ui/Button';
import { useTheme } from 'next-themes';
import { getSportTerms } from '@/utils/sport-language';
import { BrandLogo } from '@/components/ui/BrandLogo';

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
  const [locationName, setLocationName] = useState('Home Arena');
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  // Dynamically calculate zone stats directly from the tracked clip events
  const displayZones = useMemo(() => {
    const zones = {
      'Low Slot': { saves: 0, goals: 0 },
      'High Slot': { saves: 0, goals: 0 },
      'Outside Perimeter': { saves: 0, goals: 0 },
    };

    shots.forEach(s => {
      const successful = s.result === 'save' || s.result === 'clear';
      const isGoal = s.result === 'goal';
      const y = s.originY || 50;
      
      let key: keyof typeof zones = 'High Slot';
      // Simple coordinate binning to simulate zones
      if (y > 70) key = 'Outside Perimeter';
      else if (y < 40) key = 'Low Slot';

      if (successful) zones[key].saves++;
      if (isGoal) zones[key].goals++;
    });

    // Only show zones that have data; if empty, fallback to defaults just to show the UI shell
    const activeStats = Object.entries(zones).map(([label, counts]) => ({ label, ...counts })).filter(z => (z.saves + z.goals) > 0);
    return activeStats.length > 0 ? activeStats : [
        { label: 'Low Slot', saves: 0, goals: 0 },
        { label: 'High Slot', saves: 0, goals: 0 }
    ];
  }, [shots]);

  return (
    <div className="max-w-4xl mx-auto bg-card text-foreground rounded-[2.2rem] shadow-2xl border border-border/10 overflow-hidden animate-in fade-in duration-700 backdrop-blur-3xl">
      {/* 1. Header & Quick Actions */}
      <div className="p-10 pb-6 flex justify-between items-start bg-foreground/[0.02] border-b border-border/5">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[.25em] text-[10px] mb-3">
            <TrendingUp size={16} /> Performance Analytics Report
          </div>
          <h2 className="text-5xl font-black tracking-tighter leading-none mb-4">
            vs {opponent}
          </h2>
          <div className="flex items-center gap-6 text-muted-foreground font-bold text-[10px] uppercase tracking-widest">
             <span className="flex items-center gap-2 text-foreground/80"><Calendar size={14} className="text-primary/60" /> {new Date(date).toLocaleDateString()}</span>
             <span className="flex items-center gap-2 text-foreground/80 group">
                <MapPin size={14} className="text-primary/60" /> 
                {isEditingLocation ? (
                    <input 
                        autoFocus
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        onBlur={() => setIsEditingLocation(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingLocation(false)}
                        className="bg-transparent border-b border-primary/30 outline-none text-[10px] uppercase font-bold w-32 tracking-widest text-primary"
                    />
                ) : (
                    <span onClick={() => setIsEditingLocation(true)} className="cursor-pointer hover:text-primary transition-colors flex items-center gap-1">
                        {locationName}
                    </span>
                )}
             </span>
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

      {/* 3. Granular Shot Analysis by Segment */}
      <div className="px-10 space-y-12 mb-16">
        {Array.from({ length: 5 }).map((_, i) => {
          const periodNum = i + 1;
          const periodShots = shots.filter(s => s.period === periodNum).sort((a, b) => (a.clipStart || 0) - (b.clipStart || 0));
          if (periodShots.length === 0) return null;
          
          return (
            <div key={periodNum} className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/10 pb-4">
                 <h3 className="text-sm font-black uppercase tracking-[.4em] flex items-center gap-3">
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
                    {periodShots.length} Events Logged
                 </div>
              </div>
              
              <div className="space-y-4">
                {periodShots.map((shot, idx) => {
                  const formatTimestamp = (s: number | undefined) => {
                    if (s === undefined) return "00:00";
                    const mins = Math.floor(s / 60);
                    const secs = Math.floor(s % 60);
                    return `${mins}:${secs.toString().padStart(2, '0')}`;
                  };

                  return (
                    <div key={shot.id} className="grid grid-cols-12 gap-4 items-center bg-card/30 hover:bg-card/50 border border-border/10 rounded-2xl p-4 transition-all">
                       {/* 1. Time & Meta */}
                       <div className="col-span-2">
                          <div className="bg-foreground/5 text-foreground/80 font-mono text-xs px-2 py-1.5 rounded-lg border border-border/5 text-center mb-1">
                             {formatTimestamp(shot.clipStart)}
                          </div>
                          <div className={`text-[9px] font-black uppercase tracking-widest text-center ${shot.result === 'goal' ? 'text-red-500' : shot.result === 'clear' ? 'text-blue-500' : 'text-emerald-500'}`}>
                             {shot.result}
                          </div>
                       </div>

                       {/* 2. Zone View */}
                       <div className="col-span-4 flex flex-col gap-1 items-center">
                          <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Origin</div>
                          <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-border/10 bg-black relative">
                             <GameAnalysisSurface 
                                sport={sport}
                                view="field"
                                interactive={false}
                                shots={[shot]}
                             />
                          </div>
                       </div>

                       {/* 3. Net View */}
                       <div className="col-span-4 flex flex-col gap-1 items-center">
                          <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Target</div>
                          <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-border/10 bg-black relative">
                             <GameAnalysisSurface 
                                sport={sport}
                                view="net"
                                interactive={false}
                                shots={[shot]}
                              />
                          </div>
                       </div>

                       {/* 4. Action / Type */}
                       <div className="col-span-2 flex flex-col items-end gap-2 pr-2">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">{shot.shotType}</span>
                          {shot.filmUrl && (
                             <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center animate-pulse shadow-2xl">
                                <Film size={12} />
                             </div>
                          )}
                       </div>
                    </div>
                  );
                })}
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
          {displayZones.map((zone) => {
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

      {/* 5. Highlight Reel (If Clips Exist) */}
      {shots.some(s => s.filmUrl) && (
        <div className="px-10 py-12 border-t border-border/10">
           <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-3">
              <Film size={20} className="text-primary" /> V11 Highlight Reel
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {shots.filter(s => s.filmUrl).map((shot, i) => (
                <div key={shot.id} className="bg-card/40 border border-border/30 rounded-3xl overflow-hidden group">
                   <div className="aspect-video bg-black relative">
                      <video 
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                        src={`${shot.filmUrl}#t=${shot.clipStart || 0},${shot.clipEnd || 0}`}
                        preload="metadata"
                        muted
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                         <div className="flex-1">
                            <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">
                               {shot.result} — {shot.shotType}
                            </div>
                            <div className="text-lg font-black uppercase tracking-tighter leading-none">
                               High Performance Clip #{i + 1}
                            </div>
                         </div>
                         <Button 
                            variant="ghost" 
                            className="bg-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10 p-0"
                            onClick={() => window.open(shot.filmUrl, '_blank')}
                         >
                            <Maximize2 size={16} />
                         </Button>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* 6. Coach OS Integration */}
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
      <div className="px-10 py-10 flex items-center justify-center mb-8">
        <BrandLogo size={24} withText={true} textClassName="text-2xl font-medium tracking-tight" />
      </div>
    </div>
  );
}
