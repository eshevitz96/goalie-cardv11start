import React from 'react';
import { LibraryBig, ChevronDown, Target, Film, Calendar, Plus, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from './Store';
import type { GameReport } from '@/types/game';
import { EventNameModal } from './EventNameModal';

interface LibraryProps {
  onSelectReport: () => void;
  onCreateNew: () => void;
}

export function Library({ onSelectReport, onCreateNew }: LibraryProps) {
  const { reports, loadReport, clearSession, setTitle, setDate } = useAppStore();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleNewSession = () => {
    setIsModalOpen(true);
  };

  const handleModalSubmit = (name: string, date: string) => {
    clearSession();
    setTitle(name);
    setDate(date);
    setIsModalOpen(false);
    onCreateNew();
  };

  const handleReportClick = (report: GameReport) => {
    loadReport(report);
    onSelectReport();
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 py-6 md:px-16 md:py-12">
      {/* Title Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-16">
        <div className="flex items-center gap-4">
          <LibraryBig size={32} className="text-foreground md:w-9 md:h-9" strokeWidth={2.5} />
          <h1 className="text-2xl md:text-[2.5rem] font-bold tracking-tight text-foreground font-sans">Library</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-muted border border-border hover:bg-muted/80 rounded-xl text-xs font-semibold text-foreground transition-all">
            Recent Sessions
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>
          
          <button 
            onClick={handleNewSession}
            className="px-5 py-2.5 bg-foreground text-background font-semibold rounded-xl text-xs md:text-sm hover:bg-foreground/90 transition-all active:scale-[0.98] text-center"
          >
            New Game Session
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        {/* Create New Card */}
        <motion.div
          onClick={handleNewSession}
          whileHover={{ scale: 1.015, borderColor: 'var(--border)' }}
          className="p-6 md:p-8 cursor-pointer flex flex-col items-center justify-center gap-4 bg-muted/50 border-2 border-dashed border-border hover:border-foreground/30 rounded-[28px] text-muted-foreground h-[200px] md:h-[240px] transition-all"
        >
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-muted flex items-center justify-center">
            <Plus size={24} className="text-muted-foreground md:w-8 md:h-8" strokeWidth={3} />
          </div>
          <span className="font-semibold text-sm md:text-base text-muted-foreground">Create New Session</span>
        </motion.div>

        {/* Saved Reports */}
        {[...reports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((report) => (
          <motion.div
            key={report.id}
            onClick={() => handleReportClick(report)}
            whileHover={{ scale: 1.015, background: 'var(--muted)' }}
            className="p-6 md:p-8 cursor-pointer flex flex-col bg-card border border-border hover:border-foreground/30 rounded-[28px] h-[200px] md:h-[240px] justify-between transition-all shadow-sm"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="px-2 py-1 bg-muted rounded-md text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {report.sport}
                </div>
                <div className="text-muted-foreground">
                   <Clock size={16} />
                </div>
              </div>
              <h3 className="text-base md:text-xl font-bold font-sans mb-2 tracking-tight text-foreground line-clamp-1">{report.title}</h3>
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold">
                <Calendar size={12} className="text-muted-foreground" />
                {new Date(report.date).toLocaleDateString()}
              </div>
            </div>

            <div className="flex gap-4 border-t border-border pt-4">
               <div className="flex items-center gap-1.5 text-xs text-foreground/70">
                  <Film size={12} className="text-foreground/70" />
                  <span className="font-semibold">{report.clips.length} Clips</span>
               </div>
               <div className="flex items-center gap-1.5 text-xs text-foreground/70">
                  <Target size={12} className="text-foreground/70" />
                  <span className="font-semibold">{report.shots.length} Shots</span>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      <EventNameModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}
