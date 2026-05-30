import React, { useState } from 'react';
import { Header } from './Header';
import { Library } from './Library';
import { AnimatePresence, motion } from 'framer-motion';
import type { NavTab } from '@/types/game';
import { useAppStore } from './Store';
import { PlaylistSidebar } from './PlaylistSidebar';
import { TacticalPlotter } from './TacticalPlotter';
import { GameReportSummary } from './GameReportSummary';
import { UploadDropzone } from './UploadDropzone';

export default function MainApp() {
  const [activeTab, setActiveTab] = useState<NavTab>('library');
  const { clips, activeClipId, setActiveClipId, clearSession, saveReport } = useAppStore();
  
  const activeClip = clips.find(c => c.id === activeClipId);

  const goToLibrary = async () => {
    await saveReport();
    clearSession();
    setActiveTab('library');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'library': 
        return <Library onSelectReport={() => setActiveTab('report')} onCreateNew={() => setActiveTab('workspace')} />;
      
      case 'report': 
        return (
          <div style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
            <GameReportSummary
              onEditWorkspace={() => setActiveTab('workspace')}
              onSaveComplete={goToLibrary}
              onSelectClip={(clipId) => {
                setActiveClipId(clipId);
                setActiveTab('workspace');
              }}
            />
          </div>
        );
      case 'workspace':
        return (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <PlaylistSidebar onViewReport={() => setActiveTab('report')} />
            <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
              {clips.length === 0 ? (
                <div style={{ margin: 'auto', maxWidth: '600px', width: '100%' }}>
                  <UploadDropzone />
                </div>
              ) : activeClip ? (
                <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                  <div className="glass-panel" style={{ flex: 1, minWidth: 0, padding: '16px' }}>
                    {activeClip.url ? (
                      <video 
                        id="active-clip-video"
                        src={activeClip.url} 
                        controls 
                        autoPlay
                        preload="auto"
                        style={{ width: '100%', borderRadius: '8px', background: '#000', maxHeight: '500px' }} 
                      />
                    ) : (
                      <div className="flex-center" style={{ width: '100%', minHeight: '300px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px dashed var(--surface-glass-border)', flexDirection: 'column', gap: '16px', padding: '32px', textAlign: 'center' }}>
                         <div style={{ color: '#FF2E2E', fontSize: '1.25rem', fontWeight: 600 }}>Video Offline</div>
                         <UploadDropzone />
                      </div>
                    )}
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '1.1rem' }}>{activeClip.name}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{(activeClip.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, width: '440px' }}>
                    <TacticalPlotter />
                  </div>
                </div>
              ) : (
                <div className="flex-center" style={{ flex: 1, color: 'var(--text-secondary)' }}>
                  Select a clip from the playlist to begin plotting.
                </div>
              )}
            </div>
          </div>
        );
      default: return <Library onSelectReport={() => setActiveTab('report')} onCreateNew={() => setActiveTab('workspace')} />;
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      width: '100vw',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      overflow: 'hidden'
    }}>
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      <main style={{ 
        flex: 1, 
        overflow: 'hidden',
        position: 'relative',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
