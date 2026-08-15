import React, { useState, useEffect } from 'react';
import { FileBarChart2, Save, Film, Calendar, LayoutGrid } from 'lucide-react';
import { useAppStore } from './Store';
import type { Clip } from '@/types/game';
import { NetDiagram } from './NetDiagram';
import { SurfaceDiagram } from './SurfaceDiagram';

function ClipThumbnail({ clip }: { clip: Clip }) {
  const { shots } = useAppStore();
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  
  useEffect(() => {
    const clipShots = shots.filter(s => s.clipId === clip.id);
    const targetTime = clipShots.length > 0 ? (clipShots[0].videoTime || 0) : 0;
    
    if (clip.url) {
      const video = document.createElement('video');
      video.src = clip.url;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.preload = 'auto';
      
      const onSeeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx && canvas.width > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          try {
            setThumbnail(canvas.toDataURL('image/jpeg', 0.8));
          } catch (e) {
            console.error("Failed to generate thumbnail:", e);
          }
        }
        video.removeEventListener('seeked', onSeeked);
        video.src = ''; // Clear source to free memory
      };

      const onLoaded = () => {
        video.currentTime = targetTime;
        video.addEventListener('seeked', onSeeked);
      };

      video.addEventListener('loadeddata', onLoaded);
      video.addEventListener('error', (e) => console.error("Video error:", e));
      
      return () => {
        video.removeEventListener('loadeddata', onLoaded);
        video.removeEventListener('seeked', onSeeked);
        video.src = '';
      };
    }
  }, [clip.url, clip.id, shots]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {thumbnail ? (
        <img src={thumbnail} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Shot Event" />
      ) : (
        <Film size={24} color="rgba(255,255,255,0.1)" />
      )}
    </div>
  );
}

interface GameReportSummaryProps {
  onEditWorkspace: () => void;
  onSaveComplete: () => void;
  onSelectClip: (clipId: string) => void;
}

export function GameReportSummary({ onEditWorkspace, onSaveComplete, onSelectClip }: GameReportSummaryProps) {
  const { title, date, clips, shots } = useAppStore();

  const totalShots = shots.length;
  const savePct = totalShots > 0 ? ((shots.filter(s => s.isSave).length / totalShots) * 100).toFixed(1) : '100.0';
  const goals = shots.filter(s => !s.isSave).length;
  
  const deflectionShots = shots.filter(s => s.isDeflected);
  const deflectionSavePct = deflectionShots.length > 0 
    ? ((deflectionShots.filter(s => s.isSave).length / deflectionShots.length) * 100).toFixed(1) 
    : '100.0';

  const formattedDate = date ? new Date(date).toLocaleDateString() : '04/18/2026';

  return (
    <div className="max-w-[1000px] w-full mx-auto px-2 py-4 md:p-10">
      <div className="glass-panel p-4 md:p-10">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <FileBarChart2 size={32} />
              <h1 className="text-xl md:text-3xl font-bold tracking-tight">{title || 'Untitled Session'}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-xs md:text-sm">
              <Calendar size={14} className="text-muted-foreground" />
              <span>{formattedDate}</span>
              <span className="mx-1">•</span>
              <span>{clips.length} Clips processed • {totalShots} Shots logged</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={onEditWorkspace}
              style={{ 
                padding: '10px 20px', 
                background: 'var(--muted)', 
                borderRadius: '10px', 
                fontWeight: 600,
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '0.9rem'
              }}
            >
              <LayoutGrid size={16} /> Edit Clips
            </button>
            <button 
              onClick={onSaveComplete}
              style={{ 
                padding: '10px 24px', 
                background: 'var(--foreground)', 
                color: 'var(--background)', 
                borderRadius: '10px', 
                fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '0.9rem'
              }}
            >
              <Save size={16} /> Save Game
            </button>
          </div>
        </div>

        {/* Clip Roster */}
        <div style={{ marginBottom: '48px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Film size={16} color="currentColor" /> Game Film — {clips.length} Clips
          </h3>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px' }}>
            {clips.map((clip, idx) => (
              <div key={clip.id} onClick={() => onSelectClip(clip.id)} style={{ flexShrink: 0, width: '200px', cursor: 'pointer' }}>
                <div style={{ width: '100%', height: '110px', background: '#000', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
                  <ClipThumbnail clip={clip} />
                  <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(0,0,0,0.6)', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                    CLIP {idx + 1}
                  </div>
                </div>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)' }}>{shots.filter(s => s.clipId === clip.id).length} shot</span>
                  <span style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>1st</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { label: 'Total Shots', value: totalShots },
            { label: 'Save %', value: savePct + '%' },
            { label: 'Goals', value: goals },
            { label: 'Deflection Save %', value: deflectionSavePct + '%' }
          ].map((stat, i) => (
            <div key={i} className="p-4 md:p-6 rounded-2xl bg-muted/50 border border-border text-center">
              <div className="text-muted-foreground text-[10px] md:text-xs font-semibold uppercase tracking-wider mb-2">{stat.label}</div>
              <div className="text-xl md:text-3xl font-black text-foreground">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Tactical Plots Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 md:p-8 rounded-2xl bg-muted/50 border border-border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base md:text-lg font-bold text-foreground">Net Scatter Plot</h3>
              <div className="flex gap-3 text-[10px] md:text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-400" /> Save</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#FF2E2E]" /> Goal</span>
              </div>
            </div>
            <p className="text-center text-muted-foreground text-xs md:text-sm font-semibold mb-4">Goal Net</p>
            <NetDiagram onPlot={() => {}} currentPoint={null} historyShots={shots} />
          </div>

          <div className="p-4 md:p-8 rounded-2xl bg-muted/50 border border-border">
            <h3 className="text-base md:text-lg font-bold text-foreground mb-6">Origin Surface Map</h3>
            <p className="text-center text-muted-foreground text-xs md:text-sm font-semibold mb-4">Playing Surface</p>
            <SurfaceDiagram onPlot={() => {}} currentPoint={null} historyShots={shots} />
          </div>
        </div>

      </div>
    </div>
  );
}
