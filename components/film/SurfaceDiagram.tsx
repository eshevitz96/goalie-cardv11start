import React, { useRef } from 'react';
import type { Point } from '@/types/game';
import { useAppStore } from './Store';

interface SurfaceProps {
  onPlot: (point: Point) => void;
  currentPoint: Point | null;
  historyShots?: { id?: string, rinkLocation: Point | null, isSave: boolean }[];
}

const LINE = '#FFFFFF';

export function SurfaceDiagram({ onPlot, currentPoint, historyShots = [] }: SurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { sport } = useAppStore();

  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    onPlot({ x, y });
  };

  const renderHockey = () => (
    <svg viewBox="0 0 85 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      <defs>
        <clipPath id="hockeyClip">
          <path d="M 0 100 L 0 28 A 28 28 0 0 1 28 0 L 57 0 A 28 28 0 0 1 85 28 L 85 100 L 0 100 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#hockeyClip)">
        <rect x="0" y="0" width="85" height="100" fill="rgba(255,255,255,0.02)" />
        <circle cx="22" cy="31" r="15" fill="none" stroke="rgba(220,40,40,0.4)" strokeWidth="0.8" />
        <circle cx="63" cy="31" r="15" fill="none" stroke="rgba(220,40,40,0.4)" strokeWidth="0.8" />
        <circle cx="22" cy="31" r="1.5" fill="rgba(220,40,40,0.8)" />
        <circle cx="63" cy="31" r="1.5" fill="rgba(220,40,40,0.8)" />
        {/* Goal Line - Split to avoid crease overlap */}
        <line x1="0" y1="11" x2="38.5" y2="11" stroke="#FF3B30" strokeWidth="1" />
        <line x1="46.5" y1="11" x2="85" y2="11" stroke="#FF3B30" strokeWidth="1" />
        
        {/* Crease */}
        <path 
          d="M 38.5 11 L 38.5 15.47 A 6 6 0 0 0 46.5 15.47 L 46.5 11 Z" 
          fill="rgba(0, 122, 255, 0.15)" 
          stroke="#FF3B30" 
          strokeWidth="1" 
        />
        <line x1="0" y1="75" x2="85" y2="75" stroke="rgba(30,100,255,0.8)" strokeWidth="2.5" />
        <line x1="0" y1="100" x2="85" y2="100" stroke="rgba(220,40,40,0.6)" strokeWidth="2" strokeDasharray="4 2" />
        <path d="M 0 100 L 0 28 A 28 28 0 0 1 28 0 L 57 0 A 28 28 0 0 1 85 28 L 85 100" fill="none" stroke={LINE} strokeWidth="1" />
      </g>
    </svg>
  );

  const renderMensLax = () => (
    <svg viewBox="0 0 60 55" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      <rect x="0" y="0" width="60" height="55" fill="rgba(255,255,255,0.02)" />
      <circle cx="30" cy="15" r="3" fill="none" stroke={LINE} strokeWidth="0.5" />
      <line x1="28.5" y1="15" x2="31.5" y2="15" stroke={LINE} strokeWidth="0.5" />
      {/* Box lines / Alleys (20yd from sideline) */}
      <line x1="10" y1="0" x2="10" y2="35" stroke={LINE} strokeWidth="0.5" />
      <line x1="50" y1="0" x2="50" y2="35" stroke={LINE} strokeWidth="0.5" />
      <line x1="0" y1="35" x2="60" y2="35" stroke={LINE} strokeWidth="0.5" />
      <line x1="0" y1="55" x2="60" y2="55" stroke={LINE} strokeWidth="0.8" strokeDasharray="4 2" />
      <rect x="0" y="0" width="60" height="55" fill="none" stroke={LINE} strokeWidth="0.8" />
    </svg>
  );

  const renderWomensLax = () => (
    <svg viewBox="0 0 70 60" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      <rect x="0" y="0" width="70" height="60" fill="rgba(255,255,255,0.02)" />
      {/* Goal Circle (12yd from end) */}
      <circle cx="35" cy="12" r="2.6" fill="none" stroke={LINE} strokeWidth="0.5" />
      <line x1="33.7" y1="12" x2="36.3" y2="12" stroke={LINE} strokeWidth="0.5" />
      
      {/* 8m Arc with Hash Marks */}
      <path d="M 23 12 A 12 12 0 0 0 47 12" fill="none" stroke={LINE} strokeWidth="0.6" />
      {/* Hash Marks (7 total) */}
      {[0, 30, 60, 90, 120, 150, 180].map(angle => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 35 - Math.cos(rad) * 11.5;
        const y1 = 12 + Math.sin(rad) * 11.5;
        const x2 = 35 - Math.cos(rad) * 12.5;
        const y2 = 12 + Math.sin(rad) * 12.5;
        return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke={LINE} strokeWidth="0.5" />;
      })}

      {/* 12m Fan */}
      <path d="M 18 12 A 17 17 0 0 0 52 12" fill="none" stroke={LINE} strokeWidth="0.4" strokeDasharray="2 2" />
      
      {/* Midline at 60 */}
      <line x1="0" y1="60" x2="70" y2="60" stroke={LINE} strokeWidth="1" strokeDasharray="4 2" />
      <rect x="0" y="0" width="70" height="60" fill="none" stroke={LINE} strokeWidth="0.8" />
    </svg>
  );

  const renderSoccer = () => (
    <svg viewBox="0 0 75 55" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      <rect x="0" y="0" width="75" height="55" fill="rgba(255,255,255,0.02)" />
      <rect x="15.5" y="0" width="44" height="18" fill="none" stroke={LINE} strokeWidth="0.5" />
      <rect x="27.5" y="0" width="20" height="6" fill="none" stroke={LINE} strokeWidth="0.4" />
      <circle cx="37.5" cy="12" r="0.5" fill={LINE} />
      <path d="M 28 18 A 10 10 0 0 0 47 18" fill="none" stroke={LINE} strokeWidth="0.4" />
      <line x1="0" y1="55" x2="75" y2="55" stroke={LINE} strokeWidth="0.8" strokeDasharray="4 2" />
      <rect x="0" y="0" width="75" height="55" fill="none" stroke={LINE} strokeWidth="0.8" />
    </svg>
  );

  const renderFieldHockey = () => (
    <svg viewBox="0 0 60 50" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      <rect x="0" y="0" width="60" height="50" fill="rgba(255,255,255,0.02)" />
      <path d="M 14 0 A 16 16 0 0 0 46 0" fill="none" stroke={LINE} strokeWidth="0.5" />
      <circle cx="30" cy="7" r="0.5" fill={LINE} />
      <line x1="0" y1="50" x2="60" y2="50" stroke={LINE} strokeWidth="0.8" strokeDasharray="4 2" />
      <rect x="0" y="0" width="60" height="50" fill="none" stroke={LINE} strokeWidth="0.8" />
    </svg>
  );

  const getAspectRatio = () => {
    switch (sport) {
      case 'Hockey': return '85/100';
      case 'Mens Lacrosse': return '60/55';
      case 'Womens Lacrosse': return '70/60';
      case 'Soccer': return '75/55';
      case 'Field Hockey': return '60/50';
      default: return '1/1';
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="glass-panel"
      style={{
        width: '100%',
        aspectRatio: getAspectRatio(),
        background: 'rgba(255,255,255,0.01)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '0',
        position: 'relative',
        cursor: 'crosshair',
        overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        {sport === 'Hockey' && renderHockey()}
        {sport === 'Mens Lacrosse' && renderMensLax()}
        {sport === 'Womens Lacrosse' && renderWomensLax()}
        {sport === 'Soccer' && renderSoccer()}
        {sport === 'Field Hockey' && renderFieldHockey()}

        {/* Historical Shots */}
        {historyShots.map((shot, i) => (
          shot.rinkLocation && (
            <div key={i} style={{
              position: 'absolute',
              left: `${shot.rinkLocation.x * 100}%`,
              top: `${shot.rinkLocation.y * 100}%`,
              width: '5px', height: '5px',
              background: shot.isSave ? 'rgba(255,255,255,0.6)' : 'rgba(255,46,46,0.8)',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none'
            }} />
          )
        ))}

        {/* Current Selection */}
        {currentPoint && (
          <div style={{
            position: 'absolute',
            left: `${currentPoint.x * 100}%`,
            top: `${currentPoint.y * 100}%`,
            width: '12px', height: '12px',
            background: '#FFFFFF',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 15px rgba(255,255,255,0.8)',
            border: '2px solid #000',
            pointerEvents: 'none',
            zIndex: 10
          }} />
        )}
      </div>
    </div>
  );
}
