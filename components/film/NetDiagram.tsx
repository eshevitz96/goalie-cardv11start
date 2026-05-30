import React, { useRef } from 'react';
import type { Point } from '@/types/game';
import { useAppStore } from './Store';

interface NetDiagramProps {
  onPlot: (point: Point) => void;
  currentPoint: Point | null;
  historyShots?: { id?: string, netLocation: Point | null, isSave: boolean }[];
}

// Real goal dimensions (width × height):
// Ice Hockey:       6ft  × 4ft  → 3:2  → viewBox 150 × 100
// Men's Lacrosse:   6ft  × 6ft  → 1:1  → viewBox 100 × 100
// Women's Lacrosse: 6ft  × 6ft  → 1:1  → viewBox 100 × 100
// Soccer:           24ft × 8ft  → 3:1  → viewBox 300 × 100
// Field Hockey:     12ft × 7ft  → 12:7 → viewBox 171 × 100
//
// Key: viewBox MUST have the same aspect ratio as the CSS `aspectRatio`.
// With preserveAspectRatio="none", matching ratios means x-scale = y-scale,
// so dot circles never get squished into ellipses.

const SPORT_CONFIG: Record<string, { w: number; h: number; aspectRatio: string; dotSpacing: number }> = {
  'Hockey':          { w: 150, h: 100, aspectRatio: '3/2',  dotSpacing: 9  },
  'Mens Lacrosse':   { w: 100, h: 100, aspectRatio: '1/1',  dotSpacing: 7  },
  'Womens Lacrosse': { w: 100, h: 100, aspectRatio: '1/1',  dotSpacing: 7  },
  'Soccer':          { w: 300, h: 100, aspectRatio: '3/1',  dotSpacing: 10 },
  'Field Hockey':    { w: 171, h: 100, aspectRatio: '12/7', dotSpacing: 9  },
};

export function NetDiagram({ onPlot, currentPoint, historyShots = [] }: NetDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { sport } = useAppStore();

  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    onPlot({ x, y });
  };

  const cfg = SPORT_CONFIG[sport] ?? SPORT_CONFIG['Hockey'];
  const { w, h, aspectRatio, dotSpacing: sp } = cfg;
  
  // Refined styling: grey instead of white for better contrast with plots
  const NET_COLOR = 'rgba(255, 255, 255, 0.2)'; // Subtle grey
  const FRAME_COLOR = 'rgba(255, 255, 255, 0.4)'; // Clear but not overbearing
  const postW = Math.max(1, w * 0.015);
  const postH = Math.max(1, h * 0.02);

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="glass-panel"
      style={{
        width: '100%',
        aspectRatio,
        background: 'rgba(255,255,255,0.01)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '0',
        position: 'relative',
        cursor: 'crosshair',
        overflow: 'hidden'
      }}
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <defs>
          <pattern id="dot-pattern" x={sp / 2} y={sp / 2} width={sp} height={sp} patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r="0.6" fill={NET_COLOR} />
          </pattern>
        </defs>

        {/* Net mesh */}
        <rect width={w} height={h} fill="url(#dot-pattern)" />

        {/* Goal Frame Rendering */}
        {sport === 'Hockey' ? (
          // Hockey Net: Rounded Top Corners
          <path 
            d={`M 0 ${h} L 0 ${postH * 3} A ${postH * 3} ${postH * 3} 0 0 1 ${postH * 3} 0 L ${w - postH * 3} 0 A ${postH * 3} ${postH * 3} 0 0 1 ${w} ${postH * 3} L ${w} ${h}`} 
            fill="none" 
            stroke={FRAME_COLOR} 
            strokeWidth={postW * 2} 
          />
        ) : (
          // Other Sports: Squared Edges
          <>
            <rect x="0" y="0" width={postW} height={h} fill={FRAME_COLOR} />
            <rect x={w - postW} y="0" width={postW} height={h} fill={FRAME_COLOR} />
            <rect x="0" y="0" width={w} height={postH} fill={FRAME_COLOR} />
          </>
        )}
        
        {/* Floor / goal line */}
        <line x1="0" y1={h} x2={w} y2={h} stroke={FRAME_COLOR} strokeWidth={postH} />
      </svg>

      {/* Historical Shots */}
      {historyShots.map((shot, i) =>
        shot.netLocation ? (
          <div key={i} style={{
            position: 'absolute',
            left: `${shot.netLocation.x * 100}%`,
            top: `${shot.netLocation.y * 100}%`,
            width: '6px', height: '6px',
            background: shot.isSave ? 'rgba(255,255,255,0.6)' : 'rgba(255,46,46,0.8)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }} />
        ) : null
      )}

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
          boxShadow: '0 0 10px rgba(255,255,255,0.8)',
          pointerEvents: 'none',
          zIndex: 10
        }} />
      )}
    </div>
  );
}
