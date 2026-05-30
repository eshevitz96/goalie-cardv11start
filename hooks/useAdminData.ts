import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { RosterItem } from '@/types';

export function useAdminData() {
    const [dbData, setDbData] = useState<RosterItem[]>([]);
    const [coaches, setCoaches] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const [feedback, setFeedback] = useState<any[]>([]);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setIsLoading(true);
        await Promise.all([fetchRoster(), fetchCoaches(), fetchSessions(), fetchFeedback()]);
        setIsLoading(false);
    };

    const fetchFeedback = async () => {
        try {
            const { data, error } = await supabase
                .from('reflections')
                .select(`
                    *,
                    roster:roster_uploads (goalie_name, email)
                `)
                .in('title', ['BETA FEEDBACK', 'BETA_SURVEY_RESPONSE'])
                .order('created_at', { ascending: false });

            if (data) setFeedback(data);
            if (error) console.error("Feedback Fetch Error:", error);
        } catch (e) {
            console.error("Feedback Exception:", e);
        }
    };

    const fetchCoaches = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            const effectiveRole = profile?.role || 'user';
            setCurrentUser({ ...user, role: effectiveRole });
        }

        const { data } = await supabase.from('profiles').select('id, goalie_name').eq('role', 'coach');
        if (data) {
            setCoaches(data.map(c => ({ id: c.id, name: c.goalie_name || 'Unnamed Coach' })));
        }
    };

    const fetchRoster = async () => {
        try {
            const { data, error } = await supabase
                .from('roster_uploads')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDbData(data || []);
        } catch (e: any) {
            console.error("Fetch Error:", e);
        }
    };

    const fetchSessions = async () => {
        const { data, error } = await supabase
            .from('sessions')
            .select(`
                *,
                roster:roster_uploads (goalie_name, assigned_unique_id, team)
            `)
            .order('date', { ascending: false });

        if (data) setSessions(data);
    };

    const recalculateCounts = async () => {
        if (!confirm("This will scan the 'sessions' table and update S#/Lesson # for ALL goalies based on actual records found. Continue?")) return;

        setIsLoading(true);
        try {
            const { data: roster, error: rError } = await supabase.from('roster_uploads').select('id, goalie_name');
            if (rError) throw rError;

            let updatedCount = 0;

            for (const person of roster || []) {
                const { count: sCount, error: sError } = await supabase
                    .from('sessions')
                    .select('*', { count: 'exact', head: true })
                    .eq('roster_id', person.id);

                const { count: lCount, error: lError } = await supabase
                    .from('sessions')
                    .select('*', { count: 'exact', head: true })
                    .eq('roster_id', person.id)
                    .gt('lesson_number', 0);

                if (sError || lError) {
                    console.error(`Error counting for ${person.goalie_name}`, sError || lError);
                    continue;
                }

                await supabase.from('roster_uploads').update({
                    session_count: sCount || 0,
                    lesson_count: lCount || 0
                }).eq('id', person.id);

                updatedCount++;
            }

            alert(`Recalculation Complete. Updated ${updatedCount} profiles.`);
            fetchRoster();

        } catch (e: any) {
            alert("Recalculation Failed: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this goalie? This action cannot be undone.")) return;

        try {
            await supabase.from('sessions').delete().eq('roster_id', id);
            const { error } = await supabase.from('roster_uploads').delete().eq('id', id);

            if (error) throw error;

            alert("Goalie deleted successfully.");
            fetchRoster();
        } catch (err: any) {
            console.error("Delete failure:", err);
            alert("Delete failed: " + err.message);
        }
    };

    return {
        dbData,
        coaches,
        sessions,
        feedback,
        isLoading,
        currentUser,
        fetchRoster,
        fetchSessions,
        fetchFeedback,
        recalculateCounts,
        handleDelete,
        setSessions
    };
}
