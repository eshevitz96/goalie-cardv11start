import React from 'react';
import { Upload, Link2, ShieldCheck, Zap, Lock } from 'lucide-react';
import { useAppStore } from './Store';

export function UploadDropzone({ relinkClipId }: { relinkClipId?: string }) {
  const { addClips, relinkClip } = useAppStore();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'));
      if (files.length > 0) {
        if (relinkClipId) {
          relinkClip(relinkClipId, files[0]);
        } else {
          addClips(files);
        }
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(f => f.type.startsWith('video/'));
      if (files.length > 0) {
        if (relinkClipId) {
          relinkClip(relinkClipId, files[0]);
        } else {
          addClips(files);
        }
      }
    }
  };

  return (
    <div 
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
      className="flex flex-col items-center justify-center gap-6 py-12 px-8 border border-border bg-muted/30 hover:bg-muted/50 rounded-3xl cursor-pointer text-center min-h-[300px] transition-colors shadow-sm font-sans relative overflow-hidden"
    >


      <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center shadow-sm border border-border relative z-10">
        {relinkClipId ? <Link2 size={24} className="text-muted-foreground" /> : <Upload size={24} className="text-muted-foreground" />}
      </div>
      
      <div className="relative z-10 w-full max-w-[500px]">
        <h2 className="text-2xl font-black mb-2 text-foreground tracking-tight">
          {relinkClipId ? 'Relink Local Video File' : 'Drop Game Film Here'}
        </h2>
        
        {relinkClipId ? (
          <p className="text-muted-foreground text-sm font-medium mb-6">
            Select the original file to restore your session. Your tags and shots are safely saved in the cloud.
          </p>
        ) : (
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-[0.8rem] font-bold text-muted-foreground mt-4 mb-6">
            <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-[#00E676]"/> 100% Local Processing</span>
            <span className="flex items-center gap-1.5"><Zap size={16} className="text-[#00E676]"/> Zero Cloud Wait Times</span>
            <span className="flex items-center gap-1.5"><Lock size={16} className="text-[#00E676]"/> Full Privacy & Ownership</span>
          </div>
        )}
      </div>

      <label className="px-6 py-3 bg-foreground text-background rounded-xl font-bold text-[0.9rem] cursor-pointer hover:bg-foreground/90 transition-colors shadow-sm relative z-10">
        {relinkClipId ? 'Select File' : 'Browse Files'}
        <input type="file" multiple={!relinkClipId} accept="video/*" onChange={handleFileSelect} className="hidden" />
      </label>
    </div>
  );
}
