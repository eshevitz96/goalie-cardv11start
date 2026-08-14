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
        return (
          <div className="flex-1 overflow-y-auto w-full">
            <Library onSelectReport={() => setActiveTab('report')} onCreateNew={() => setActiveTab('workspace')} />
          </div>
        );
      
      case 'report': 
        return (
          <div className="flex-1 p-4 md:p-8 overflow-y-auto flex justify-center">
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
          <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden">
            <PlaylistSidebar onViewReport={() => setActiveTab('report')} />
            <div className="flex-1 p-4 md:p-6 flex flex-col gap-6 overflow-y-auto">
              {clips.length === 0 ? (
                <div className="m-auto max-w-[600px] w-full">
                  <UploadDropzone />
                </div>
              ) : activeClip ? (
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  <div className="glass-panel flex-1 w-full p-4">
                    {activeClip.url ? (
                      <video 
                        id="active-clip-video"
                        src={activeClip.url} 
                        controls 
                        autoPlay
                        preload="auto"
                        className="w-full rounded-lg bg-black max-h-[500px]"
                      />
                    ) : (
                      <div className="flex-center flex-col gap-4 p-8 text-center w-full min-h-[300px] rounded-lg bg-[var(--bg-tertiary)] border border-dashed border-[var(--surface-glass-border)]">
                         <div className="text-red-500 text-xl font-semibold">Video Offline</div>
                         <UploadDropzone />
                      </div>
                    )}
                    <div className="mt-4 flex justify-between items-center">
                      <h3 className="text-[1.1rem] font-bold text-white">{activeClip.name}</h3>
                      <p className="text-[var(--text-secondary)] text-sm">{(activeClip.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <div className="w-full lg:w-[440px] shrink-0">
                    <TacticalPlotter />
                  </div>
                </div>
              ) : (
                <div className="flex-center flex-1 text-[var(--text-secondary)]">
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
    <div className="flex flex-col min-h-screen md:h-screen w-full md:w-screen bg-[var(--bg-primary)] text-[var(--text-primary)] md:overflow-hidden">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      <main className="flex-1 relative flex flex-col md:overflow-hidden bg-[var(--bg-primary)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full flex flex-col"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
