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
    <div style={{ padding: '48px 64px', width: '100%', maxWidth: '1600px', margin: '0' }}>
      {/* Title Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <LibraryBig size={36} strokeWidth={2.5} color="#FFFFFF" />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.03em', fontFamily: 'var(--font-brand)' }}>Library</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '10px 18px', 
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontWeight: 600
          }}>
            Recent Sessions
            <ChevronDown size={14} color="rgba(255, 255, 255, 0.4)" />
          </button>
          
          <button 
            onClick={handleNewSession}
            style={{ 
              padding: '12px 24px', 
              background: '#FFFFFF', 
              color: '#000000', 
              fontWeight: 600, 
              borderRadius: '12px',
              fontSize: '0.95rem',
              letterSpacing: '-0.01em',
              cursor: 'pointer'
            }}
          >
            New Game Session
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '32px' }}>
        {/* Create New Card */}
        <motion.div
          onClick={handleNewSession}
          whileHover={{ scale: 1.015, borderColor: 'rgba(255, 255, 255, 0.2)' }}
          style={{ 
            padding: '48px 32px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '2px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: '28px',
            color: 'rgba(255, 255, 255, 0.3)',
            height: '240px'
          }}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={32} color="#FFFFFF" strokeWidth={3} />
          </div>
          <span style={{ fontWeight: 600, fontSize: '1.1rem', color: '#FFFFFF' }}>Create New Session</span>
        </motion.div>

        {/* Saved Reports */}
        {[...reports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((report) => (
          <motion.div
            key={report.id}
            onClick={() => handleReportClick(report)}
            whileHover={{ scale: 1.015, background: 'rgba(255, 255, 255, 0.04)' }}
            style={{ 
              padding: '32px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '28px',
              height: '240px',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {report.sport}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.2)' }}>
                   <Clock size={18} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.02em' }}>{report.title}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
                <Calendar size={14} color="#FFFFFF" />
                {new Date(report.date).toLocaleDateString()}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Film size={14} color="#FFFFFF" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{report.clips.length} Clips</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Target size={14} color="#FFFFFF" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{report.shots.length} Shots</span>
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
