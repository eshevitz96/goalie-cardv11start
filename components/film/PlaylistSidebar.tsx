import React from 'react';
import { useAppStore } from './Store';
import { Trash2, Film, Plus } from 'lucide-react';

interface PlaylistProps {
  onViewReport: () => void;
}

export function PlaylistSidebar({ onViewReport }: PlaylistProps) {
  const { clips, activeClipId, setActiveClipId, removeClip, addClips } = useAppStore();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addClips(files);
    }
  };

  return (
    <div style={{
      width: 'var(--sidebar-w)',
      height: '100%',
      borderRight: '1px solid var(--surface-glass-border)',
      background: 'var(--bg-secondary)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ padding: '32px 24px', borderBottom: '1px solid var(--surface-glass-border)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Film size={20} />
          Clip Playlist
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {clips.length} clip{clips.length !== 1 ? 's' : ''} loaded
          </p>
          {clips.length > 0 && (
            <button 
              onClick={onViewReport}
              style={{ fontSize: '0.8rem', padding: '6px 14px', background: '#FFFFFF', color: '#000000', borderRadius: '10px', fontWeight: 700 }}
            >
              Review Report
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {clips.map((clip, idx) => {
          const isActive = clip.id === activeClipId;
          return (
            <div 
              key={clip.id}
              onClick={() => setActiveClipId(clip.id)}
              className="glass-panel"
              style={{
                padding: '16px',
                marginBottom: '12px',
                cursor: 'pointer',
                borderColor: isActive ? '#FFFFFF' : 'var(--surface-glass-border)',
                background: isActive ? 'rgba(255,255,255,0.05)' : 'var(--surface-glass)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {idx + 1}. {clip.name}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {(clip.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeClip(clip.id); }}
                  style={{ color: 'rgba(255,255,255,0.2)', padding: '4px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '24px', borderTop: '1px solid var(--surface-glass-border)' }}>
        <label style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          width: '100%', padding: '12px', borderRadius: '12px', 
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-glass-border)',
          fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer'
        }}>
          <Plus size={18} /> Add More Clips
          <input type="file" multiple accept="video/*" onChange={handleFileSelect} style={{ display: 'none' }} />
        </label>
      </div>
    </div>
  );
}
