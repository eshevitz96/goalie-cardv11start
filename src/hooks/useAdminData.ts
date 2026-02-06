
import { useState, useEffect } from 'react';
import { rosterService } from '@/services/roster';
import { sessionsService } from '@/services/sessions';
import { coachesService } from '@/services/coaches';
import { parseCsv, ParsedRosterItem } from '@/utils/csv-parser';
import { RosterItem } from '@/types';
// import { toast } from '@/context/ToastContext'; // Removed invalid import
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/utils/supabase/client';

export function useAdminData() {
    const [dbData, setDbData] = useState<RosterItem[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [coaches, setCoaches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();

    // Data Fetching
    const refreshAll = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                fetchRoster(),
                fetchSessions(),
                fetchCoaches()
            ]);
        } catch (e) {
            console.error("Error refreshing admin data", e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRoster = async () => {
        try {
            const data = await rosterService.fetchAll();
            if (data) {
                const sorted = data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setDbData(sorted);
            }
        } catch (e) { console.error(e); }
    };

    const fetchSessions = async () => {
        try {
            const data = await sessionsService.fetchAllWithDetails();
            if (data) setSessions(data);
        } catch (e) { console.error(e); }
    };

    const fetchCoaches = async () => {
        try {
            const data = await coachesService.fetchAllProfiles();
            if (data) {
                setCoaches(data.map((c: any) => ({ id: c.id, name: c.goalie_name || 'Unnamed Coach' })));
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        refreshAll();
    }, []);

    // Actions
    const handleCsvUpload = async (csvText: string, targetGoalieId?: string) => {
        try {
            const parsedItems = await parseCsv(csvText, dbData, targetGoalieId);
            const result = await rosterService.processUpload(parsedItems, dbData);

            if (result.success) {
                toast.success(`Processed ${parsedItems.length} rows successfully.`);
                await refreshAll();
                return { success: true };
            } else {
                toast.error(result.message || "Upload failed");
                return { success: false, error: result.message };
            }
        } catch (e: any) {
            console.error("Upload Error:", e);
            toast.error("Upload Error: " + e.message);
            return { success: false, error: e.message };
        }
    };

    const deleteGoalie = async (id: string) => {
        try {
            // Delete sessions first (if not cascading)
            await sessionsService.deleteByRosterId(id);
            await rosterService.delete(id);
            toast.success("Goalie deleted successfully.");
            setDbData(prev => prev.filter(g => g.id !== id));
            setSessions(prev => prev.filter(s => s.roster_id !== id));
        } catch (e: any) {
            toast.error("Delete failed: " + e.message);
        }
    };

    const resetDatabase = async () => {
        try {
            await sessionsService.deleteAll();
            await rosterService.deleteAll();
            toast.success("Database Wiped Clean.");
            await refreshAll();
        } catch (e: any) {
            toast.error("Reset failed: " + e.message);
        }
    };

    const recalculateCounts = async () => {
        try {
            toast.info("Recalculating stats...");
            // Logic moved from page.tsx
            // 1. Fetch sessions counts
            // This is heavy, maybe move to a storage procedure or service function
            // For now, implementing client-side loop as before but cleaner
            const roster = dbData;
            let updatedCount = 0;

            for (const person of roster) {
                const { count: sCount } = await supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('roster_id', person.id);
                const { count: lCount } = await supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('roster_id', person.id).gt('lesson_number', 0);

                await rosterService.update(person.id, {
                    session_count: sCount || 0,
                    lesson_count: lCount || 0
                });
                updatedCount++;
            }
            toast.success(`Recalculation Complete. Updated ${updatedCount} profiles.`);
            fetchRoster();
        } catch (e: any) {
            toast.error("Recalc failed: " + e.message);
        }
    };

    const deleteSession = async (sessionId: string) => {
        try {
            await sessionsService.delete(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            toast.success("Session deleted");
        } catch (e: any) {
            toast.error("Error deleting session");
        }
    }

    return {
        dbData,
        sessions,
        coaches,
        isLoading,
        refreshAll,
        actions: {
            uploadCsv: handleCsvUpload,
            deleteGoalie,
            resetDatabase,
            recalculateCounts,
            deleteSession
        }
    };
}
