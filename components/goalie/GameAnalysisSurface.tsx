"use client";

import { useState } from 'react';
import { SupportedSport, ShotEvent, ShotResult } from '@/types/goalie-v11';
import { motion } from 'framer-motion';

interface GameAnalysisSurfaceProps {
  sport: SupportedSport;
  shots?: ShotEvent[];
  onPlotShot?: (x: number, y: number) => void;
  interactive?: boolean;
  view?: 'field' | 'net';
}

export function GameAnalysisSurface({ 
  sport, 
  shots = [], 
  onPlotShot, 
  interactive = true,
  view: externalView
}: GameAnalysisSurfaceProps) {
  const [internalView, setInternalView] = useState<'field' | 'net'>('field');
  const view = externalView || internalView;
  const setView = externalView ? () => {} : setInternalView;
  const [showHeatmap, setShowHeatmap] = useState(true);
  
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !onPlotShot) return;
    
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    onPlotShot(x, y);
  };

  const renderNet = () => {
    // Official aspect ratios for net dimensions
    // Soccer: 3:1 (24'x8') | Hockey: 1.5:1 (6'x4') | Field Lac: 1:1 (6'x6') | Box Lac: 1.2:1 (4.9'x4')
    let width = 60;
    let height = 60;
    let y_offset = 20;
    let isRounded = false;

    switch (sport) {
      case 'soccer': 
        width = 90; height = 30; y_offset = 30; 
        break;
      case 'hockey': 
        width = 66; height = 44; y_offset = 20; 
        isRounded = true; 
        break;
      case 'lacrosse-box': 
        width = 54; height = 45; y_offset = 20; 
        break;
      case 'lacrosse-boys':
      case 'lacrosse-girls':
        width = 55; height = 55; y_offset = 15; 
        break;
      default: 
        width = 60; height = 60; y_offset = 15; 
        break; 
    }

    const x = (100 - width) / 2;

    return (
      <>
        {/* The Cage/Frame */}
        <rect 
          x={x} y={y_offset} width={width} height={height} 
          fill="none" stroke="currentColor" strokeWidth="2.5" 
          rx={isRounded ? "8" : "1"}
        />
        
        {/* Mesh Background Pattern */}
        <defs>
          <pattern id="mesh" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
            <path d="M 3 0 L 0 0 0 3" fill="none" stroke="currentColor" strokeWidth="0.08" opacity="0.4"/>
          </pattern>
        </defs>
        <rect x={x} y={y_offset} width={width} height={height} fill="url(#mesh)" />

        {/* Top Shelf / Depth indicators (slight opacity) */}
        <rect x={x} y={y_offset} width={width} height={2} fill="currentColor" opacity="0.05" />
      </>
    );
  };

  /**
   * Render accurate professional markings
   */
  const renderMarkings = () => {
    if (view === 'net') return renderNet();

    switch (sport) {
      case 'hockey': {
        const H = 92.0; // Restored to full size
        const GL = H - 12.9; 
        const CR = 7.0; 
        const CW = 9.4; 
        const CD = 5.3; 
        const DS = GL - 23.5; 
        const DRX = 25.8; 
        const CRAD = 17.6; 

        return (
          <>
            <rect x="0" y={100-H} width="100" height={H} fill="none" stroke="currentColor" strokeWidth="0.8" rx="12" />
            <line x1="0" y1={GL} x2="100" y2={GL} stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
            <path 
              d={`M ${50 - CW/2} ${GL} L ${50 - CW/2} ${GL - CD} A ${CR} ${CR} 0 0 1 ${50 + CW/2} ${GL - CD} L ${50 + CW/2} ${GL}`} 
              fill="rgba(0,120,255,0.2)" stroke="currentColor" strokeWidth="1" 
            />
            <circle cx={50 - DRX} cy={DS} r="1" fill="currentColor" />
            <circle cx={50 + DRX} cy={DS} r="1" fill="currentColor" />
            <circle cx={50 - DRX} cy={DS} r={CRAD} fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="1 2" />
            <circle cx={50 + DRX} cy={DS} r={CRAD} fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="1 2" />
            <rect x="46.5" y={GL} width="7" height="4" fill="currentColor" opacity="0.2" />
          </>
        );
      }
      case 'soccer': {
        const yard = 2.27; 
        const PA_H = 18 * yard; 
        const GA_W = 20 * yard; 
        const GA_H = 6 * yard;  
        const PS = 12 * yard;   
        const G = 8 * yard;     
        const bottom = 95; // Brought up from 100 to clear key

        return (
          <>
            <rect x="0" y={bottom - PA_H - 10} width="100" height={PA_H + 10} fill="none" stroke="currentColor" strokeWidth="0.8" />
            <rect x="0" y={bottom - PA_H} width="100" height={PA_H} fill="none" stroke="currentColor" strokeWidth="0.8" />
            <rect x={50 - GA_W/2} y={bottom - GA_H} width={GA_W} height={GA_H} fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="50" cy={bottom - PS} r="1" fill="currentColor" />
            <path d={`M${50 - 16} ${bottom - PA_H} A 22.7 22.7 0 0 1 ${50 + 16} ${bottom - PA_H}`} fill="none" stroke="currentColor" strokeWidth="0.5" />
            <rect x={50 - G/2} y={bottom} width={G} height="2" fill="currentColor" opacity="0.2" />
          </>
        );
      }
      case 'lacrosse-girls': {
          const GL = 70; // Moved up
          const crease = 5.4; 
          const arc8 = 14.5; 
          const fan12 = 21.8; 
          const center = 50;

          return (
            <>
              <rect x="0" y="0" width="100" height="92" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.8" />
              <line x1="0" y1="20" x2="100" y2="20" stroke="currentColor" strokeWidth="1" /> 
              <line x1={center - fan12} y1={GL} x2={center + fan12} y2={GL} stroke="currentColor" strokeWidth="1" />
              <circle cx={center} cy={GL} r={crease} fill="none" stroke="currentColor" strokeWidth="1" />
              <path d={`M${center - arc8} ${GL} A ${arc8} ${arc8} 0 0 1 ${center + arc8} ${GL}`} fill="none" stroke="currentColor" strokeWidth="0.8" />
              <path d={`M${center - fan12} ${GL} A ${fan12} ${fan12} 0 0 1 ${center + fan12} ${GL}`} fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
              <text x={center - arc8 - 2} y={GL - 2} fill="currentColor" fontSize="2" opacity="0.4">8m</text>
              <text x={center - fan12 - 2} y={GL - 6} fill="currentColor" fontSize="2" opacity="0.3">12m</text>
              <path d={`M${center - 2.5} ${GL} L${center + 2.5} ${GL} L${center} ${GL + 3.5} Z`} fill="none" stroke="currentColor" strokeWidth="1.2" />
            </>
          );
      }
      case 'lacrosse-boys':
      case 'lacrosse-box': {
        const GL = 68.0; // Moved up 
        const EL = 92.0; // Moved up 
        const RL = 20.0; 
        const GW = 3.3;  
        const GH = 3.3;  
        const BoxW = 58.3; 

        return (
          <>
            <rect x="0" y="0" width="100" height={EL} fill="none" stroke="currentColor" strokeWidth="1.2" opacity="1" />
            <line x1="0" y1={EL} x2="100" y2={EL} stroke="currentColor" strokeWidth="1.5" />
            <line x1="0" y1={RL} x2="100" y2={RL} stroke="currentColor" strokeWidth="1" />
            <rect x={50 - BoxW/2} y={RL} width={BoxW} height={GL - RL} fill="currentColor" opacity="0.05" stroke="currentColor" strokeWidth="0.8" />
            <text x="3" y={EL - (EL-GL)/2} fill="currentColor" fontSize="2" opacity="0.4" transform={`rotate(-90, 3, ${EL - (EL-GL)/2})`}>15 yd</text>
            <text x="3" y={GL - (GL-RL)/2} fill="currentColor" fontSize="2" opacity="0.4" transform={`rotate(-90, 3, ${GL - (GL-RL)/2})`}>20 yd</text>
            <circle cx="50" cy={GL} r={5.4} fill="none" stroke="currentColor" strokeWidth="1.2" />
            {/* Improved Goal Representation */}
            <path d={`M${50 - GW/2} ${GL} L${50 + GW/2} ${GL} L${50} ${GL + GH} Z`} fill="currentColor" opacity="0.25" />
            <path d={`M${50 - GW/2} ${GL} L${50 + GW/2} ${GL} L${50} ${GL + GH} Z`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <line x1="50" y1={GL} x2="50" y2={GL + GH} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
          </>
        );
      }
      default:
        return <rect width="100" height="100" fill="none" stroke="currentColor" strokeWidth="0.5" />;
    }
  };

  const getShotColor = (result: ShotResult) => {
    if (result === 'goal') return 'rgb(239, 68, 68)'; 
    if (result === 'save') return '#10b981'; // Emerald Green
    return 'rgb(163, 163, 163)'; 
  };

  const getAspectRatio = () => {
    switch (sport) {
      case 'hockey': return 'aspect-[85/75]';
      case 'soccer': return 'aspect-[44/30]';
      case 'lacrosse-boys':
      case 'lacrosse-girls':
      case 'lacrosse-box': return 'aspect-[60/55]';
      default: return 'aspect-square';
    }
  };

  return (
    <div className={`relative w-full ${getAspectRatio()} flex flex-col items-center justify-center`}>
      <div className="relative w-full h-full rounded-[2rem] border border-border/10 bg-secondary/5 dark:bg-black/5 p-8 flex items-center justify-center text-foreground">
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full text-foreground/70 cursor-crosshair select-none overflow-visible"
          onClick={handleClick}
        >
          {/* Heat Wave Layer */}
          {view === 'net' && showHeatmap && (
            <defs>
              <filter id="heat">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
              </filter>
            </defs>
          )}

          {view === 'net' && showHeatmap && (
             <g filter="url(#heat)">
               {shots.map((shot, idx) => (
                 <circle 
                   key={`heat-${idx}`}
                   cx={shot.targetX ?? 50}
                   cy={shot.targetY ?? 50}
                   r="12"
                   fill={shot.result === 'goal' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.2)'}
                 />
               ))}
             </g>
          )}

          {renderMarkings()}
          
          {/* Plotting Shots */}
          {shots.map((shot, idx) => (
            <motion.circle
              key={shot.id || idx}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              cx={view === 'field' ? shot.originX : (shot.targetX ?? 50)}
              cy={view === 'field' ? shot.originY : (shot.targetY ?? 50)}
              r={view === 'net' ? "1.6" : "2.2"}
              fill={getShotColor(shot.result)}
              className="filter drop-shadow-md"
            />
          ))}
        </svg>

        {/* Legend Position - Clean bottom center with more padding */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-4 pointer-events-none p-2 bg-card/90 backdrop-blur-md rounded-xl border border-border/40 shadow-xl z-20 w-fit">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              <span className="text-[9px] font-black uppercase text-foreground tracking-widest">Saves</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-[9px] font-black uppercase text-foreground tracking-widest">Goals</span>
           </div>
        </div>

        {view === 'net' && (
          <button 
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="absolute bottom-4 left-6 p-2 bg-card/90 backdrop-blur-md rounded-xl border border-border/40 pointer-events-auto shadow-xl z-20"
          >
            <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${showHeatmap ? 'text-primary' : 'text-muted-foreground'}`}>
               Heatwave
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
