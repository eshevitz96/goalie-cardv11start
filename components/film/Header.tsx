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
    <header style={{ 
      padding: '0 24px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      background: 'var(--bg-primary)',
      position: 'sticky',
      top: 0,
      zIndex: 1100,
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      height: '80px'
    }}>
      {/* Left Group: Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '48px', height: '100%' }}>
        {activeTab !== 'library' && (
          <button 
            onClick={handleBackToLibrary}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              color: 'rgba(255, 255, 255, 0.45)',
              fontSize: '0.95rem',
              fontWeight: 500,
              transition: 'color 0.2s',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.01em'
            }}
            onMouseOver={e => e.currentTarget.style.color = '#FFFFFF'}
            onMouseOut={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.45)'}
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
            Library
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '1.5rem', marginLeft: activeTab === 'library' ? '12px' : '0' }}>
          <span style={{ 
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-brand)',
            fontWeight: 700,
            fontSize: '1.4rem'
          }}>
            Goalie Card
          </span>
          
          <span style={{ 
            color: 'rgba(255, 255, 255, 0.2)', 
            fontWeight: 400
          }}>
            /
          </span>
          
          <span style={{ 
            color: 'rgba(255, 255, 255, 0.45)', 
            fontWeight: 500,
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-heading)', // Inter
            fontSize: '1.5rem'
          }}>
            {activeLabel}
          </span>
        </div>
      </div>

      {/* Right Group: Sport Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <select 
          value={sport}
          onChange={(e) => setSport(e.target.value as any)}
          style={{ 
            padding: '8px 32px 8px 16px', 
            background: 'rgba(255, 255, 255, 0.05)', 
            borderRadius: '12px', 
            fontSize: '0.85rem', 
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            fontWeight: 600,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-0.01em',
            cursor: 'pointer',
            outline: 'none',
            appearance: 'auto', // Restore native behavior for reliability
            textAlign: 'left',
            minWidth: '160px'
          }}
        >
          <option value="Hockey">Ice Hockey</option>
          <option value="Mens Lacrosse">Men's Lacrosse</option>
          <option value="Womens Lacrosse">Women's Lacrosse</option>
          <option value="Soccer">Soccer</option>
          <option value="Field Hockey">Field Hockey</option>
        </select>
      </div>
    </header>
  );
}
