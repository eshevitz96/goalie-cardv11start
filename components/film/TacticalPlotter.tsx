import React, { useState, useEffect } from 'react';
import { useAppStore } from './Store';
import { NetDiagram } from './NetDiagram';
import { SurfaceDiagram } from './SurfaceDiagram';
import { Target, ChevronRight, Trash2, Pencil, X } from 'lucide-react';
import type { Point, Shot } from '@/types/game';

const getPeriodOptions = (sport: string) => {
  if (sport === 'Soccer') return ['1st Half', '2nd Half', 'Extra Time'];
  if (sport === 'Mens Lacrosse' || sport === 'Womens Lacrosse' || sport === 'Field Hockey')
    return ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter', 'Overtime'];
  return ['1st Period', '2nd Period', '3rd Period', 'Overtime'];
};

const getPeriodLabel = (sport: string) => {
  if (sport === 'Soccer') return 'Half';
  if (sport === 'Mens Lacrosse' || sport === 'Womens Lacrosse' || sport === 'Field Hockey') return 'Quarter';
  return 'Period';
};

const getShotOptions = (sport: string) => {
  if (sport === 'Hockey')         return ['Wrist Shot', 'Snap Shot', 'Slap Shot', 'Backhand', 'Tip-in'];
  if (sport === 'Mens Lacrosse' || sport === 'Womens Lacrosse') return ['Overhand', 'Sidearm', 'Underhand', 'BTB'];
  if (sport === 'Soccer')         return ['Instep', 'Inside foot', 'Outside foot', 'Header', 'Volley'];
  if (sport === 'Field Hockey')   return ['Push', 'Hit', 'Flick', 'Scoop', 'Slap'];
  return ['Other'];
};

const SELECT_CLASS = "w-full py-3.5 px-4 bg-muted border border-border rounded-xl text-foreground text-[0.95rem] font-semibold appearance-none bg-no-repeat bg-[right_14px_center] transition-colors focus:border-foreground/30 outline-none";

const LABEL_CLASS = "text-[0.72rem] font-bold text-muted-foreground tracking-[0.07em] uppercase mb-1.5 block";

export function TacticalPlotter() {
  const { sport, addShot, updateShot, removeShot, activeClipId, shots } = useAppStore();

  const [netPos,      setNetPos]      = useState<Point | null>(null);
  const [surfacePos,  setSurfacePos]  = useState<Point | null>(null);
  const [period,      setPeriod]      = useState(() => getPeriodOptions(sport)[0]);
  const [shotType,    setShotType]    = useState(() => getShotOptions(sport)[0]);
  const [isSave,      setIsSave]      = useState(true);
  const [isDeflected, setIsDeflected] = useState(false);
  const [isScreened,  setIsScreened]  = useState(false);
  const [editId,      setEditId]      = useState<string | null>(null);

  const clipShots = shots.filter(s => s.clipId === activeClipId);
  const isEditing = editId !== null;

  useEffect(() => {
    setPeriod(getPeriodOptions(sport)[0]);
    setShotType(getShotOptions(sport)[0]);
  }, [sport]);

  useEffect(() => { clearForm(); }, [activeClipId]);

  const clearForm = () => {
    setEditId(null); setNetPos(null); setSurfacePos(null);
    setIsSave(true); setIsDeflected(false); setIsScreened(false);
  };

  const loadShot = (shot: Shot) => {
    setEditId(shot.id); setNetPos(shot.netLocation); setSurfacePos(shot.rinkLocation);
    setPeriod(shot.period); setShotType(shot.shotType); setIsSave(shot.isSave); 
    setIsDeflected(shot.isDeflected); setIsScreened(shot.isScreened);
  };

  const handleSave = () => {
    if (!activeClipId) return;
    if (isEditing) {
      const orig = shots.find(s => s.id === editId);
      if (orig) updateShot({ ...orig, period, shotType: shotType as any, isDeflected, isSave, netLocation: netPos, rinkLocation: surfacePos });
      clearForm();
    } else {
      const video = document.getElementById('active-clip-video') as HTMLVideoElement;
      addShot({ clipId: activeClipId, period, shotType: shotType as any, isDeflected, isScreened, isSave, netLocation: netPos, rinkLocation: surfacePos, videoTime: video?.currentTime ?? 0 });
      setNetPos(null); setSurfacePos(null); setIsDeflected(false); setIsScreened(false); setIsSave(true);
    }
  };

  const handleDelete = (e: React.MouseEvent, shotId: string) => {
    e.stopPropagation();
    removeShot(shotId);
    if (editId === shotId) clearForm();
  };

  return (
    <div className="flex flex-col bg-card border-l border-border h-full min-w-[340px] font-sans">
      {/* ── Header ── */}
      <div className="flex justify-between items-center px-6 py-5 border-b border-border">
        <h2 className="text-xl font-bold flex items-center gap-2 tracking-tight text-foreground font-sans">
          <Target size={20} strokeWidth={2.5} className="text-primary" />
          {isEditing ? 'Edit Shot' : 'Plot Shot'}
        </h2>
        <div className="flex items-center gap-3">
          {isEditing && (
            <button onClick={clearForm} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full border border-border bg-transparent cursor-pointer transition-colors">
              <X size={12} /> New
            </button>
          )}
          <span className="text-xs text-muted-foreground font-semibold">
            {clipShots.length} shots in this clip
          </span>
        </div>
      </div>

      {/* ── Diagrams ── */}
      <div className="grid grid-cols-2 gap-4 px-5 pt-6 pb-4">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold text-foreground text-center tracking-tight">Playing Surface</p>
          <div className="bg-muted rounded-xl p-2 border border-border">
             <SurfaceDiagram onPlot={setSurfacePos} currentPoint={surfacePos} historyShots={clipShots} />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold text-foreground text-center tracking-tight">Goal Net</p>
          <div className="bg-muted rounded-xl p-2 border border-border">
             <NetDiagram onPlot={setNetPos} currentPoint={netPos} historyShots={clipShots} />
          </div>
        </div>
      </div>

      <div className="h-px bg-border mx-5" />

      {/* ── Controls ── */}
      <div className="p-5 flex flex-col gap-5 flex-1 overflow-y-auto">
        {/* Row 1: Period + Result */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>{getPeriodLabel(sport)}</label>
            <select 
              value={period} 
              onChange={e => setPeriod(e.target.value)} 
              className={SELECT_CLASS}
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")` }}
            >
              {getPeriodOptions(sport).map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>Result</label>
            <div className="flex bg-muted rounded-xl p-1 border border-border">
              <button 
                onClick={() => setIsSave(true)}  
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${isSave ? 'bg-background text-foreground shadow-sm' : 'bg-transparent text-muted-foreground'}`}
              >
                Save
              </button>
              <button 
                onClick={() => setIsSave(false)} 
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${!isSave ? 'bg-destructive text-destructive-foreground shadow-sm' : 'bg-transparent text-muted-foreground'}`}
              >
                Goal
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Shot Type + Modifiers */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Shot Type</label>
            <select 
              value={shotType} 
              onChange={e => setShotType(e.target.value)} 
              className={SELECT_CLASS}
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")` }}
            >
              {getShotOptions(sport).map(o => <option key={o} value={o}>{o}</option>)}
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Modifiers</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsDeflected(!isDeflected)}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                  isDeflected ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                }`}
              >
                Deflected
              </button>
              <button
                onClick={() => setIsScreened(!isScreened)}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                  isScreened ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                }`}
              >
                Screened
              </button>
            </div>
          </div>
        </div>

        {/* Save / Update */}
        <button 
          onClick={handleSave} 
          className={`w-full py-4 mt-auto rounded-xl font-bold text-[1rem] flex items-center justify-center gap-2 cursor-pointer transition-all ${
            isEditing 
              ? 'bg-muted border border-border text-foreground hover:bg-muted/80' 
              : 'bg-foreground text-background shadow-md hover:bg-foreground/90'
          }`}
        >
          {isEditing ? <><Pencil size={15} /> Update Shot</> : <>Save Event <ChevronRight size={18} /></>}
        </button>
      </div>

      {/* ── Logged Shots Scroll ── */}
      {clipShots.length > 0 && (
        <div className="bg-muted/30 border-t border-border mt-auto">
          <div className="px-5 py-4">
            <label className={`${LABEL_CLASS} mb-2`}>Logged Shots ({clipShots.length})</label>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {clipShots.map((shot, i) => {
                const active = editId === shot.id;
                return (
                  <div
                    key={shot.id}
                    onClick={() => active ? clearForm() : loadShot(shot)}
                    className={`relative shrink-0 w-14 h-10 rounded-xl flex items-center justify-center cursor-pointer border transition-colors ${
                      active ? 'bg-background border-foreground shadow-sm' : 'bg-card border-border hover:border-foreground/30'
                    }`}
                  >
                    <span className={`text-sm font-black ${shot.isSave ? 'text-foreground' : 'text-destructive'}`}>
                      {shot.isSave ? 'SV' : 'GL'}
                    </span>
                    {active && (
                      <button 
                        onClick={e => handleDelete(e, shot.id)} 
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center cursor-pointer shadow-sm hover:scale-110 transition-transform"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
