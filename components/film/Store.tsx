import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Clip, Shot, SportType, GameReport, ShotTypeType } from '@/types/game';
import { supabase } from '@/utils/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { fetchFilmReports, toggleClipShareWithCoach } from '@/app/film/actions';

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
  isCoachView: boolean;
  
  // Actions
  setTitle: (title: string) => void;
  setDate: (date: string) => void;
  addClips: (files: File[]) => void;
  relinkClip: (clipId: string, file: File) => void;
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
  toggleShareWithCoach: (clipId: string) => Promise<void>;
  refreshReports: () => Promise<void>;
}

const AppStoreContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { userId: authUserId } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (authUserId) {
      setUserId(authUserId);
    } else if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      setUserId("14092722-0e2b-492b-866c-0f77e87469de"); // Localhost developer bypass
    } else {
      setUserId(null);
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
  const [isCoachView, setIsCoachView] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper mapper to translate user primary_sport to film SportType
  function mapPrimarySportToSportType(sportKey: string | null | undefined): SportType {
    if (!sportKey) return 'Mens Lacrosse';
    switch (sportKey) {
      case 'ice_hockey_mens':
      case 'ice_hockey_womens':
        return 'Hockey';
      case 'soccer_mens':
      case 'soccer_womens':
        return 'Soccer';
      case 'lacrosse_mens':
        return 'Mens Lacrosse';
      case 'lacrosse_womens':
        return 'Womens Lacrosse';
      case 'field_hockey':
        return 'Field Hockey';
      default:
        return 'Mens Lacrosse';
    }
  }

  // Load sport on initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('film-analysis-sport');
      if (saved) {
        setSport(saved as SportType);
        return;
      }
    }

    async function loadUserPrimarySport() {
      if (!userId) return;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('primary_sport')
          .eq('auth_user_id', userId)
          .maybeSingle();

        if (!error && data?.primary_sport) {
          setSport(mapPrimarySportToSportType(data.primary_sport));
        } else {
          setSport('Mens Lacrosse');
        }
      } catch (err) {
        console.error('Error fetching user primary sport:', err);
        setSport('Mens Lacrosse');
      }
    }

    loadUserPrimarySport();
  }, [userId]);

  // Fetch reports from Supabase with server-side access control and signed URLs
  const fetchReports = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetchFilmReports();
      if (res.success && res.reports) {
        setReports(res.reports);
        setIsCoachView(Boolean(res.isCoachView));
      } else if (res.error) {
        console.error('Error fetching film reports:', res.error);
      }
    } catch (err) {
      console.error('Error in fetchReports:', err);
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
      file: file,
      sharedWithCoach: false
    }));
    setClips(prev => [...prev, ...newClips]);
    if (!activeClipId && newClips.length > 0) {
      setActiveClipId(newClips[0].id);
    }
  };

  const relinkClip = (clipId: string, file: File) => {
    setClips(prev => prev.map(c => {
      if (c.id === clipId) {
        return {
          ...c,
          url: URL.createObjectURL(file),
          file: file,
          name: file.name,
          size: file.size
        };
      }
      return c;
    }));
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

  const toggleShareWithCoach = async (clipId: string) => {
    const clip = clips.find(c => c.id === clipId);
    const newShared = !clip?.sharedWithCoach;
    
    // Update local state immediately for snappy UX
    setClips(prev => prev.map(c => c.id === clipId ? { ...c, sharedWithCoach: newShared } : c));

    try {
      const res = await toggleClipShareWithCoach(clipId, newShared);
      if (!res.success) {
        // Revert on error
        setClips(prev => prev.map(c => c.id === clipId ? { ...c, sharedWithCoach: !newShared } : c));
        alert(`Failed to update share setting: ${res.error}`);
      }
    } catch (err: any) {
      setClips(prev => prev.map(c => c.id === clipId ? { ...c, sharedWithCoach: !newShared } : c));
      alert(`Error toggling share setting: ${err.message}`);
    }
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
    // Dynamically retrieve authentic auth.uid() from the active Supabase session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const authUid = user?.id || userId;

    if (!authUid) {
      const errorMsg = 'No authenticated user session found. Please log in to save reports.';
      console.error(errorMsg, authError);
      alert(errorMsg);
      return;
    }

    try {
      // 1. Upsert game report
      const { data: insertedReport, error: reportError } = await supabase
        .from('game_reports')
        .upsert({
          id: reportId,
          user_id: authUid,
          title: title || 'Untitled Session',
          date: date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          sport,
          season: '2024-25',
        })
        .select('id')
        .single();

      if (reportError) {
        console.error('game_reports save error:', reportError);
        alert(`Failed to save game report: ${reportError.message}`);
        throw reportError;
      }

      const savedReportId = insertedReport?.id || reportId;

      // 2. Upload any local clip files to private storage under {authUid}/...
      const processedClips: Array<{ id: string; name: string; storagePath: string | null; size: number; sharedWithCoach: boolean }> = [];

      for (const clip of clips) {
        let storagePath: string | null = null;

        if (clip.file) {
          const sanitizedFileName = clip.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const destPath = `${authUid}/${clip.id}_${sanitizedFileName}`;

          const { error: uploadError } = await supabase.storage
            .from('game-film')
            .upload(destPath, clip.file, {
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) {
            console.warn(`[saveReport] Storage upload warning for ${clip.name}:`, uploadError);
            // Fallback: keep existing relative path if any
            storagePath = clip.url && !clip.url.startsWith('blob:') ? clip.url : destPath;
          } else {
            storagePath = destPath;
          }
        } else if (clip.url && !clip.url.startsWith('blob:')) {
          // Already a storage path or URL, strip out host/bucket to keep relative path
          if (clip.url.includes('/game-film/')) {
            const parts = clip.url.split('/game-film/');
            storagePath = parts[1];
          } else {
            storagePath = clip.url;
          }
        }

        processedClips.push({
          id: clip.id,
          name: clip.name,
          storagePath: storagePath,
          size: clip.size || 0,
          sharedWithCoach: Boolean(clip.sharedWithCoach)
        });
      }

      // 3. Sync clips (delete and insert)
      const { error: clipsDeleteError } = await supabase
        .from('film_clips')
        .delete()
        .eq('report_id', savedReportId);

      if (clipsDeleteError) {
        console.error('film_clips delete error:', clipsDeleteError);
        alert(`Warning: Failed to clean up old clips: ${clipsDeleteError.message}`);
      }

      if (processedClips.length > 0) {
        const insertClips = processedClips.map(c => ({
          id: c.id,
          report_id: savedReportId,
          user_id: authUid,
          name: c.name,
          url: c.storagePath, // Relative storage path only — never public URL
          size: c.size,
          shared_with_coach: c.sharedWithCoach
        }));

        const { error: clipsError } = await supabase
          .from('film_clips')
          .insert(insertClips);

        if (clipsError) {
          console.error('film_clips save error:', clipsError);
          alert(`Failed to save film clips: ${clipsError.message}`);
          throw clipsError;
        }
      }

      // 4. Sync shots (delete and insert)
      const { error: shotsDeleteError } = await supabase
        .from('film_shots')
        .delete()
        .eq('report_id', savedReportId);

      if (shotsDeleteError) {
        console.error('film_shots delete error:', shotsDeleteError);
        alert(`Warning: Failed to clean up old shots: ${shotsDeleteError.message}`);
      }

      if (shots.length > 0) {
        const insertShots = shots.map(s => ({
          id: s.id,
          report_id: savedReportId,
          clip_id: s.clipId,
          user_id: authUid,
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
          alert(`Failed to save film shots: ${shotsError.message}`);
          throw shotsError;
        }
      }

      // 5. Sync aggregate stats to game_sessions (for Dashboard and Profile)
      const { data: pubUser, error: pubUserError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUid)
        .maybeSingle();

      if (pubUserError) {
        console.error('Failed to resolve public user ID for game_sessions sync:', pubUserError);
      }

      if (pubUser?.id) {
        const totalShots = shots.length;
        const totalSaves = shots.filter(s => s.isSave).length;
        const goalsAllowed = totalShots - totalSaves;
        const savePct = totalShots > 0 ? parseFloat((totalSaves / totalShots).toFixed(3)) : 0.0;

        let targetGameId = null;

        const { data: existingSession } = await supabase
          .from('game_sessions')
          .select('game_id')
          .eq('id', savedReportId)
          .maybeSingle();

        targetGameId = existingSession?.game_id;

        if (!targetGameId) {
          const { data: newGame, error: newGameError } = await supabase
            .from('games')
            .insert({
              opponent_name: title || 'Film Session',
              game_date: date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              location: 'Film Room'
            })
            .select('id')
            .single();
          if (!newGameError && newGame) {
            targetGameId = newGame.id;
          }
        }

        const { error: sessionError } = await supabase
          .from('game_sessions')
          .upsert({
            id: savedReportId,
            user_id: pubUser.id,
            game_id: targetGameId,
            status: 'complete',
            started_at: date || new Date().toISOString(),
            completed_at: new Date().toISOString(),
            shots_faced: totalShots,
            saves: totalSaves,
            goals_allowed: goalsAllowed,
            save_pct: savePct,
            notes_summary: title || 'Untitled Session',
          });

        if (sessionError) {
          console.error('game_sessions save error (non-blocking):', sessionError);
        }
      }

      // 6. Refresh Reports List
      await fetchReports();

    } catch (err) {
      console.error('Failed to save report to Supabase:', err);
      alert(`Error saving report: ${(err as any)?.message || err}`);
      throw err;
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
    relinkClip,
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
    toggleShareWithCoach,
    refreshReports: fetchReports,
    reports,
    isCoachView,
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
