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
    <div className="w-full md:w-[var(--sidebar-w)] h-auto md:h-full border-b md:border-b-0 md:border-r border-border bg-muted/30 flex flex-col shrink-0 font-sans">
      <div className="p-6 md:p-8 border-b border-border">
        <h2 className="text-xl font-bold flex items-center gap-3 font-sans text-foreground tracking-tight">
          <Film size={20} />
          Clip Playlist
        </h2>
        <div className="flex justify-between items-center mt-4">
          <p className="text-muted-foreground text-sm font-medium">
            {clips.length} clip{clips.length !== 1 ? 's' : ''} loaded
          </p>
          {clips.length > 0 && (
            <button 
              onClick={onViewReport}
              className="text-xs px-3.5 py-1.5 bg-foreground text-background rounded-lg font-bold hover:bg-foreground/90 transition-colors"
            >
              Review Report
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {clips.map((clip, idx) => {
          const isActive = clip.id === activeClipId;
          return (
            <div 
              key={clip.id}
              onClick={() => setActiveClipId(clip.id)}
              className={`p-4 mb-3 cursor-pointer rounded-2xl border transition-all flex justify-between items-start ${
                isActive 
                  ? 'bg-muted border-foreground/30 shadow-sm' 
                  : 'bg-card border-border hover:border-foreground/20'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm whitespace-nowrap overflow-hidden text-ellipsis text-foreground">
                  {idx + 1}. {clip.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  {(clip.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removeClip(clip.id); }}
                className="text-muted-foreground hover:text-destructive p-1 transition-colors rounded-md hover:bg-destructive/10"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="p-6 border-t border-border bg-background/50">
        <label className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-muted/50 hover:bg-muted border border-border text-sm font-semibold text-foreground cursor-pointer transition-colors">
          <Plus size={18} /> Add More Clips
          <input type="file" multiple accept="video/*" onChange={handleFileSelect} className="hidden" />
        </label>
      </div>
    </div>
  );
}
