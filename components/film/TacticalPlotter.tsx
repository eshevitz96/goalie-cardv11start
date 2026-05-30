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

const SELECT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#FFF',
  fontSize: '0.95rem',
  fontWeight: 600,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 600,
  color: 'rgba(255,255,255,0.4)',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  marginBottom: '6px',
};

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
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', background: 'rgba(10,10,10,0.92)', borderRadius: '20px', overflow: 'hidden', minWidth: '340px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 22px 16px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '9px', letterSpacing: '-0.02em' }}>
          <Target size={17} strokeWidth={2.5} />
          {isEditing ? 'Edit Shot' : 'Plot Shot'}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isEditing && (
            <button onClick={clearForm} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', padding: '5px 10px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', cursor: 'pointer' }}>
              <X size={11} /> New
            </button>
          )}
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>
            {clipShots.length} shots in this clip
          </span>
        </div>
      </div>

      {/* ── Diagrams ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '0 18px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', textAlign: 'center', letterSpacing: '-0.01em' }}>Playing Surface</p>
          <SurfaceDiagram onPlot={setSurfacePos} currentPoint={surfacePos} historyShots={clipShots} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', textAlign: 'center', letterSpacing: '-0.01em' }}>Goal Net</p>
          <NetDiagram onPlot={setNetPos} currentPoint={netPos} historyShots={clipShots} />
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0 18px' }} />

      {/* ── Controls ── */}
      <div style={{ padding: '18px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Row 1: Period + Result */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <p style={LABEL_STYLE}>{getPeriodLabel(sport)}</p>
            <select value={period} onChange={e => setPeriod(e.target.value)} style={SELECT_STYLE}>
              {getPeriodOptions(sport).map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <p style={LABEL_STYLE}>Result</p>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.07)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button onClick={() => setIsSave(true)}  style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700, background: isSave  ? '#FFF' : 'transparent', color: isSave  ? '#000' : 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>Save</button>
              <button onClick={() => setIsSave(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700, background: !isSave ? '#FF2E2E' : 'transparent', color: !isSave ? '#FFF' : 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>Goal</button>
            </div>
          </div>
        </div>

        {/* Row 2: Shot Type + Modifiers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <p style={LABEL_STYLE}>Shot Type</p>
            <select value={shotType} onChange={e => setShotType(e.target.value)} style={SELECT_STYLE}>
              {getShotOptions(sport).map(o => <option key={o} value={o}>{o}</option>)}
              <option value="Other">Other</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={LABEL_STYLE}>Modifiers</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => setIsDeflected(!isDeflected)}
                style={{ padding: '12px 8px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 600, background: isDeflected ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)', border: isDeflected ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.08)', color: isDeflected ? '#FFF' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.15s' }}
              >
                Deflected
              </button>
              <button
                onClick={() => setIsScreened(!isScreened)}
                style={{ padding: '12px 8px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 600, background: isScreened ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)', border: isScreened ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.08)', color: isScreened ? '#FFF' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.15s' }}
              >
                Screened
              </button>
            </div>
          </div>
        </div>

        {/* Save / Update */}
        <button onClick={handleSave} style={{ width: '100%', padding: '16px', background: isEditing ? 'rgba(255,255,255,0.1)' : '#FFFFFF', color: isEditing ? '#FFF' : '#000', borderRadius: '14px', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', border: isEditing ? '1px solid rgba(255,255,255,0.2)' : 'none', cursor: 'pointer', boxShadow: isEditing ? 'none' : '0 4px 20px rgba(255,255,255,0.12)' }}>
          {isEditing ? <><Pencil size={15} /> Update Shot</> : <>Save Event <ChevronRight size={16} /></>}
        </button>
      </div>

      {/* ── Logged Shots Scroll ── */}
      {clipShots.length > 0 && (
        <>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0 18px' }} />
          <div style={{ padding: '14px 18px 18px' }}>
            <p style={{ ...LABEL_STYLE, marginBottom: '10px' }}>Logged Shots ({clipShots.length})</p>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
              {clipShots.map((shot, i) => {
                const active = editId === shot.id;
                return (
                  <div
                    key={shot.id}
                    onClick={() => active ? clearForm() : loadShot(shot)}
                    style={{ flexShrink: 0, width: '60px', height: '40px', borderRadius: '10px', background: active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', position: 'relative' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: shot.isSave ? '#FFF' : '#FF6B6B' }}>{shot.isSave ? 'SV' : 'GL'}</span>
                    </div>
                    {active && (
                      <button onClick={e => handleDelete(e, shot.id)} style={{ position: 'absolute', top: '-7px', right: '-7px', width: '20px', height: '20px', borderRadius: '50%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
