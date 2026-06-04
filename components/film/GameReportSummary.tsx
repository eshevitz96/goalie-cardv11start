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
    <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', color: '#FFFFFF', padding: '40px 20px' }}>
      <div className="glass-panel" style={{ padding: '40px', borderRadius: '32px', background: 'rgba(20, 20, 20, 0.6)' }}>
        
        {/* Header Area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <FileBarChart2 size={32} />
              <h1 style={{ fontSize: '2.25rem', fontWeight: 700 }}>{title || 'Untitled Session'}</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem' }}>
              <Calendar size={14} color="#FFFFFF" />
              <span>{formattedDate}</span>
              <span style={{ margin: '0 4px' }}>•</span>
              <span>{clips.length} Clips processed • {totalShots} Shots logged</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={onEditWorkspace}
              style={{ 
                padding: '10px 20px', 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: '10px', 
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.1)',
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
                background: '#FFFFFF', 
                color: '#000000', 
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
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Film size={16} color="#FFFFFF" /> Game Film — {clips.length} Clips
          </h3>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px' }}>
            {clips.map((clip, idx) => (
              <div key={clip.id} onClick={() => onSelectClip(clip.id)} style={{ flexShrink: 0, width: '200px', cursor: 'pointer' }}>
                <div style={{ width: '100%', height: '110px', background: '#000', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <ClipThumbnail clip={clip} />
                  <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                    CLIP {idx + 1}
                  </div>
                </div>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{shots.filter(s => s.clipId === clip.id).length} shot</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>1st</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '40px' }}>
          {[
            { label: 'Total Shots', value: totalShots },
            { label: 'Save %', value: savePct + '%' },
            { label: 'Goals', value: goals },
            { label: 'Deflection Save %', value: deflectionSavePct + '%' }
          ].map((stat, i) => (
            <div key={i} style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{stat.label}</div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Tactical Plots Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ padding: '32px', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Net Scatter Plot</h3>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} /> Save</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,46,46,0.8)' }} /> Goal</span>
              </div>
            </div>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 600 }}>Goal Net</p>
            <NetDiagram onPlot={() => {}} currentPoint={null} historyShots={shots} />
          </div>

          <div style={{ padding: '32px', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px' }}>Origin Surface Map</h3>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 600 }}>Playing Surface</p>
            <SurfaceDiagram onPlot={() => {}} currentPoint={null} historyShots={shots} />
          </div>
        </div>

      </div>
    </div>
  );
}
