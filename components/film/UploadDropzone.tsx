import React from 'react';
import { Upload } from 'lucide-react';
import { useAppStore } from './Store';

export function UploadDropzone() {
  // TODO Phase 2: Replace with Supabase Storage bucket upload
  const { addClips } = useAppStore();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'));
      addClips(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(f => f.type.startsWith('video/'));
      addClips(files);
    }
  };

  return (
    <div 
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
      className="flex flex-col items-center justify-center gap-6 py-16 px-8 border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 rounded-3xl cursor-pointer text-center min-h-[300px] transition-colors shadow-sm font-sans"
    >
      <div className="w-20 h-20 rounded-full bg-background flex items-center justify-center shadow-sm border border-border">
        <Upload size={32} className="text-muted-foreground" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-2 text-foreground font-sans tracking-tight">Drop Game Clips Here</h2>
        <p className="text-muted-foreground text-[0.95rem] font-medium">Supports MP4, MOV up to 50MB per clip</p>
      </div>

      <label className="px-6 py-3 bg-foreground text-background rounded-xl font-bold text-[0.95rem] cursor-pointer hover:bg-foreground/90 transition-colors shadow-sm">
        Browse Files
        <input type="file" multiple accept="video/*" onChange={handleFileSelect} className="hidden" />
      </label>
    </div>
  );
}
