import React from 'react';
import Link from 'next/link';
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
    <header className="sticky top-0 z-[1100] w-full bg-background border-b border-border h-auto md:h-20">
      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-16 flex flex-col md:flex-row justify-between items-center h-full py-3 md:py-0 gap-3 md:gap-0">
        {/* Left Group: Navigation */}
        <div className="flex items-center justify-between md:justify-start gap-4 md:gap-12 w-full md:w-auto h-full">
          {activeTab !== 'library' && (
            <button 
              onClick={handleBackToLibrary}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-[0.95rem] font-medium transition-colors font-sans tracking-tight"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
              Library
            </button>
          )}

          <div className={`flex items-center gap-2 md:gap-4 text-xl md:text-2xl ${activeTab === 'library' ? 'ml-0' : 'ml-0'}`}>
            <Link 
              href="/dashboard"
              className="text-foreground tracking-tight font-sans font-bold text-[1.25rem] md:text-[1.4rem] hover:text-foreground/80 transition-colors"
            >
              Goalie Card
            </Link>
            
            <span className="text-muted-foreground/30 font-light hidden md:inline">
              /
            </span>
            
            <span className="text-muted-foreground font-medium tracking-tight font-sans text-[1.3rem] md:text-[1.5rem] hidden md:inline">
              {activeLabel}
            </span>
          </div>
        </div>

        {/* Right Group: Sport Selector (takes full width on mobile) */}
        <div className="w-full md:w-auto flex items-center justify-end">
          <select 
            value={sport}
            onChange={(e) => setSport(e.target.value as any)}
            className="w-full md:w-auto px-4 py-2 bg-muted border border-border rounded-xl text-xs font-semibold text-foreground cursor-pointer outline-none md:min-w-[160px] text-left appearance-auto font-sans"
          >
            <option value="Hockey" className="bg-background text-foreground">Ice Hockey</option>
            <option value="Mens Lacrosse" className="bg-background text-foreground">Men's Lacrosse</option>
            <option value="Womens Lacrosse" className="bg-background text-foreground">Women's Lacrosse</option>
            <option value="Soccer" className="bg-background text-foreground">Soccer</option>
            <option value="Field Hockey" className="bg-background text-foreground">Field Hockey</option>
          </select>
        </div>
      </div>
    </header>
  );
}
