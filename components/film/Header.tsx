import React from 'react';
import { ChevronLeft } from 'lucide-react';
import type { NavTab } from '@/types/game';
import { useAppStore } from './Store';

interface HeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { title, sport, setSport, clearSession } = useAppStore();
  const handleBackToLibrary = () => {
    clearSession();
    onTabChange('library');
  };

  const activeLabel = activeTab === 'library' 
    ? 'Library' 
    : (title || (activeTab === 'workspace' ? 'Workspace' : 'Game Report'));

  return (
    <header className="sticky top-0 z-[1100] flex flex-col md:flex-row justify-between items-center bg-[var(--bg-primary)] border-b border-white/5 px-4 md:px-6 py-3 md:py-0 h-auto md:h-20 gap-3 md:gap-0">
      {/* Left Group: Navigation */}
      <div className="flex items-center justify-between md:justify-start gap-4 md:gap-12 w-full md:w-auto h-full">
        {activeTab !== 'library' && (
          <button 
            onClick={handleBackToLibrary}
            className="flex items-center gap-1 text-[rgba(255,255,255,0.45)] hover:text-white text-[0.95rem] font-medium transition-colors font-sans tracking-tight"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
            Library
          </button>
        )}

        <div className={`flex items-center gap-2 md:gap-4 text-xl md:text-2xl ${activeTab === 'library' ? 'ml-1 md:ml-3' : 'ml-0'}`}>
          <span className="text-white tracking-tight font-sans font-bold text-[1.25rem] md:text-[1.4rem]">
            Goalie Card
          </span>
          
          <span className="text-white/20 font-light hidden md:inline">
            /
          </span>
          
          <span className="text-white/45 font-medium tracking-tight font-sans text-[1.3rem] md:text-[1.5rem] hidden md:inline">
            {activeLabel}
          </span>
        </div>
      </div>

      {/* Right Group: Sport Selector (takes full width on mobile) */}
      <div className="w-full md:w-auto flex items-center justify-end">
        <select 
          value={sport}
          onChange={(e) => setSport(e.target.value as any)}
          className="w-full md:w-auto px-4 py-2 bg-white/5 border border-white/15 rounded-xl text-xs font-semibold text-white cursor-pointer outline-none md:min-w-[160px] text-left appearance-auto"
        >
          <option value="Hockey" className="bg-neutral-950">Ice Hockey</option>
          <option value="Mens Lacrosse" className="bg-neutral-950">Men's Lacrosse</option>
          <option value="Womens Lacrosse" className="bg-neutral-950">Women's Lacrosse</option>
          <option value="Soccer" className="bg-neutral-950">Soccer</option>
          <option value="Field Hockey" className="bg-neutral-950">Field Hockey</option>
        </select>
      </div>
    </header>
  );
}
