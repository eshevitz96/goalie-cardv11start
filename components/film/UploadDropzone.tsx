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
      className="glass-panel flex-center"
      style={{
        flexDirection: 'column',
        gap: '24px',
        padding: '64px 32px',
        border: '2px dashed var(--surface-glass-border)',
        background: 'rgba(255, 255, 255, 0.01)',
        cursor: 'pointer',
        textAlign: 'center',
        minHeight: '300px'
      }}
    >
      <div style={{ 
        width: '80px', 
        height: '80px', 
        borderRadius: '50%', 
        background: 'rgba(255, 255, 255, 0.05)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Upload size={32} color="var(--text-secondary)" />
      </div>
      
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Drop Game Clips Here</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Supports MP4, MOV up to 50MB per clip</p>
      </div>

      <label style={{ 
        padding: '12px 24px', 
        background: '#FFFFFF', 
        color: '#000000', 
        borderRadius: '12px', 
        fontWeight: 700,
        fontSize: '0.95rem'
      }}>
        Browse Files
        <input type="file" multiple accept="video/*" onChange={handleFileSelect} style={{ display: 'none' }} />
      </label>
    </div>
  );
}
