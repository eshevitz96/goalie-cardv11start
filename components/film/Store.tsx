import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Clip, Shot, SportType, GameReport, ShotTypeType } from '@/types/game';
import { supabase } from '@/utils/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AppState {
  reportId: string;
  title: string;
  date: string;
  clips: Clip[];
  deletedClips: Clip[];
  shots: Shot[];
  activeClipId: string | null;
  sport: SportType;
  autoPlayEnabled: boolean;
  reports: GameReport[];
  loading: boolean;
  
  // Actions
  setTitle: (title: string) => void;
  setDate: (date: string) => void;
  addClips: (files: File[]) => void;
  removeClip: (clipId: string) => void;
  restoreClip: (clipId: string) => void;
  purgeClip: (clipId: string) => void;
  setActiveClipId: (id: string | null) => void;
  addShot: (shot: Omit<Shot, 'id' | 'timestamp'>) => void;
  removeShot: (shotId: string) => void;
  updateShot: (shot: Shot) => void;
  setSport: (sport: SportType) => void;
  toggleAutoPlay: () => void;
  loadReport: (report: GameReport) => void;
  saveReport: () => Promise<void>;
  clearSession: () => void;
}

const AppStoreContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { userId: authUserId } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      setUserId("14092722-0e2b-492b-866c-0f77e87469de"); // Localhost developer bypass
    } else {
      setUserId(authUserId);
    }
  }, [authUserId]);
  
  const [reportId, setReportId] = useState<string>(uuidv4());
  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [clips, setClips] = useState<Clip[]>([]);
  const [deletedClips, setDeletedClips] = useState<Clip[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [sport, setSport] = useState<SportType>('Hockey');
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [reports, setReports] = useState<GameReport[]>([]);
  const [loading, setLoading] = useState(false);

  // Load sport from localStorage if exists
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('film-analysis-sport');
      if (saved) setSport(saved as SportType);
    }
  }, []);

  // Fetch reports from Supabase when userId is resolved
  const fetchReports = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // 1. Fetch user's own game reports via RLS
      const { data: reportsData, error: reportsError } = await supabase
        .from('game_reports')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (reportsError) throw reportsError;

      if (!reportsData || reportsData.length === 0) {
        setReports([]);
        return;
      }

      const reportIds = reportsData.map(r => r.id);

      // 2. Parallel fetch clips and shots for these reports
      const [clipsRes, shotsRes] = await Promise.all([
        supabase.from('film_clips').select('*').in('report_id', reportIds),
        supabase.from('film_shots').select('*').in('report_id', reportIds)
      ]);

      if (clipsRes.error) throw clipsRes.error;
      if (shotsRes.error) throw shotsRes.error;

      // 3. Assemble the full GameReport objects
      const assembledReports: GameReport[] = reportsData.map(report => {
        const reportClips = (clipsRes.data || [])
          .filter(c => c.report_id === report.id)
          .map(c => ({
            id: c.id,
            name: c.name,
            size: Number(c.size || 0),
            url: c.url || '',
            file: null
          }));

        const reportShots = (shotsRes.data || [])
          .filter(s => s.report_id === report.id)
          .map(s => ({
            id: s.id,
            clipId: s.clip_id,
            timestamp: new Date(s.created_at).getTime(),
            period: s.period,
            shotType: s.shot_type as ShotTypeType,
            isDeflected: s.is_deflected,
            isScreened: s.is_screened || false,
            isSave: s.is_save,
            netLocation: s.net_x !== null && s.net_y !== null ? { x: Number(s.net_x), y: Number(s.net_y) } : null,
            rinkLocation: s.rink_x !== null && s.rink_y !== null ? { x: Number(s.rink_x), y: Number(s.rink_y) } : null,
            videoTime: s.video_time !== null ? Number(s.video_time) : undefined
          }));

        return {
          id: report.id,
          title: report.title,
          date: report.date,
          sport: report.sport as SportType,
          clips: reportClips,
          shots: reportShots
        };
      });

      setReports(assembledReports);
    } catch (err) {
      console.error('Error fetching reports from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchReports();
    } else {
      setReports([]);
    }
  }, [userId]);

  const toggleAutoPlay = () => setAutoPlayEnabled(p => !p);

  const addClips = (files: File[]) => {
    const newClips: Clip[] = files.map(file => ({
      id: uuidv4(),
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
      file: file
    }));
    setClips(prev => [...prev, ...newClips]);
    if (!activeClipId && newClips.length > 0) {
      setActiveClipId(newClips[0].id);
    }
  };

  const removeClip = (clipId: string) => {
    const clip = clips.find(c => c.id === clipId);
    if (clip) {
      setDeletedClips(prev => [{ ...clip, deletedAt: Date.now() }, ...prev]);
      setClips(prev => prev.filter(c => c.id !== clipId));
      if (activeClipId === clipId) setActiveClipId(null);
    }
  };

  const restoreClip = (clipId: string) => {
    const clip = deletedClips.find(c => c.id === clipId);
    if (clip) {
      setClips(prev => [...prev, clip]);
      setDeletedClips(prev => prev.filter(c => c.id !== clipId));
    }
  };

  const purgeClip = (clipId: string) => {
    setDeletedClips(prev => prev.filter(c => c.id !== clipId));
  };

  const addShot = (shotData: Omit<Shot, 'id' | 'timestamp'>) => {
    const newShot: Shot = {
      ...shotData,
      id: uuidv4(),
      timestamp: Date.now()
    };
    setShots(prev => [...prev, newShot]);
  };

  const removeShot = (shotId: string) => {
    setShots(prev => prev.filter(s => s.id !== shotId));
  };

  const updateShot = (updatedShot: Shot) => {
    setShots(prev => prev.map(s => s.id === updatedShot.id ? updatedShot : s));
  };

  const loadReport = (report: GameReport) => {
    setReportId(report.id);
    setTitle(report.title);
    setDate(report.date || '');
    setClips(report.clips);
    setShots(report.shots);
    setSport(report.sport || 'Hockey');
    if (report.clips.length > 0) setActiveClipId(report.clips[0].id);
  };

  const saveReport = async () => {
    if (!userId) return;

    try {
      // 1. Upsert game report
      const { error: reportError } = await supabase
        .from('game_reports')
        .upsert({
          id: reportId,
          user_id: userId,
          title: title || 'Untitled Session',
          date: date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          sport,
          season: '2024-25',
          updated_at: new Date().toISOString()
        });

      if (reportError) {
        console.error('game_reports save error:', reportError);
        throw reportError;
      }

      // 2. Sync clips (delete and insert)
      const { error: clipsDeleteError } = await supabase
        .from('film_clips')
        .delete()
        .eq('report_id', reportId);

      if (clipsDeleteError) {
        console.error('film_clips delete error:', clipsDeleteError);
      }

      if (clips.length > 0) {
        const insertClips = clips.map(c => ({
          id: c.id,
          report_id: reportId,
          user_id: userId,
          name: c.name,
          url: c.url || null,
          size: c.size || 0
        }));

        const { error: clipsError } = await supabase
          .from('film_clips')
          .insert(insertClips);

        if (clipsError) {
          console.error('film_clips save error:', clipsError);
          throw clipsError;
        }
      }

      // 3. Sync shots (delete and insert)
      const { error: shotsDeleteError } = await supabase
        .from('film_shots')
        .delete()
        .eq('report_id', reportId);

      if (shotsDeleteError) {
        console.error('film_shots delete error:', shotsDeleteError);
      }

      if (shots.length > 0) {
        const insertShots = shots.map(s => ({
          id: s.id,
          report_id: reportId,
          clip_id: s.clipId,
          user_id: userId,
          period: s.period || '1st',
          shot_type: s.shotType || 'Wrist',
          is_deflected: s.isDeflected || false,
          is_screened: s.isScreened || false,
          is_save: s.isSave,
          rink_x: s.rinkLocation ? parseFloat(s.rinkLocation.x.toFixed(4)) : null,
          rink_y: s.rinkLocation ? parseFloat(s.rinkLocation.y.toFixed(4)) : null,
          net_x: s.netLocation ? parseFloat(s.netLocation.x.toFixed(4)) : null,
          net_y: s.netLocation ? parseFloat(s.netLocation.y.toFixed(4)) : null,
          video_time: s.videoTime !== undefined ? parseFloat(s.videoTime.toFixed(3)) : null
        }));

        const { error: shotsError } = await supabase
          .from('film_shots')
          .insert(insertShots);

        if (shotsError) {
          console.error('film_shots save error:', shotsError);
          throw shotsError;
        }
      }

      // 4. Sync aggregate stats to game_sessions (for Dashboard and Profile)
      const totalShots = shots.length;
      const totalSaves = shots.filter(s => s.isSave).length;
      const goalsAllowed = totalShots - totalSaves;
      const savePct = totalShots > 0 ? parseFloat((totalSaves / totalShots).toFixed(3)) : 0.0;

      const { error: sessionError } = await supabase
        .from('game_sessions')
        .upsert({
          id: reportId, // 1:1 Parity
          user_id: userId,
          status: 'complete',
          started_at: date || new Date().toISOString(),
          completed_at: new Date().toISOString(),
          shots_faced: totalShots,
          saves: totalSaves,
          goals_allowed: goalsAllowed,
          save_pct: savePct,
          notes_summary: title || 'Untitled Session',
          updated_at: new Date().toISOString()
        });

      if (sessionError) {
        console.error('game_sessions save error:', sessionError);
      }

      // 5. Refresh Reports List
      await fetchReports();

    } catch (err) {
      console.error('Failed to save report to Supabase:', err);
    }
  };

  const clearSession = () => {
    setReportId(uuidv4());
    setTitle('');
    setDate('');
    setClips([]);
    setShots([]);
    setActiveClipId(null);
    setDeletedClips([]);
  };

  const value: AppState = {
    reportId,
    title,
    date,
    clips,
    deletedClips,
    shots,
    activeClipId,
    sport,
    autoPlayEnabled,
    setTitle,
    setDate,
    addClips,
    removeClip,
    restoreClip,
    purgeClip,
    setActiveClipId,
    addShot,
    removeShot,
    updateShot,
    setSport,
    toggleAutoPlay,
    loadReport,
    saveReport,
    clearSession,
    reports,
    loading
  };

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
