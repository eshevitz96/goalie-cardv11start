import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { RosterItem } from '@/types';

export function useAdminData() {
    const [dbData, setDbData] = useState<RosterItem[]>([]);
    const [coaches, setCoaches] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setIsLoading(true);
        await Promise.all([fetchRoster(), fetchCoaches(), fetchSessions()]);
        setIsLoading(false);
    };

    const fetchCoaches = async () => {
        // 1. Get Current User
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

            // EMAIL ALLOWLIST CHECK - Update this list to add more admins
            const ADMIN_EMAILS = ['thegoaliebrand@gmail.com', 'eshevitz96@gmail.com'];

            const userEmail = user.email?.toLowerCase() || '';
            const isEmailAllowed = ADMIN_EMAILS.includes(userEmail);

            // Force admin role if on allowlist, otherwise trust DB but warn if not allowed
            const effectiveRole = isEmailAllowed ? 'admin' : (profile?.role || 'user');

            setCurrentUser({ ...user, role: effectiveRole });

            if (!isEmailAllowed && effectiveRole !== 'admin') {
                alert("ACCESS DENIED: You are logged in as '" + userEmail + "'. This area is restricted to authorized administrators only.");
            }
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
            // 1. Fetch all roster IDs
            const { data: roster, error: rError } = await supabase.from('roster_uploads').select('id, goalie_name');
            if (rError) throw rError;

            let updatedCount = 0;

            for (const person of roster || []) {
                // 2. Count sessions for this person
                const { count: sCount, error: sError } = await supabase
                    .from('sessions')
                    .select('*', { count: 'exact', head: true })
                    .eq('roster_id', person.id);

                // Note: We don't have a strict 'Lesson' type field in sessions table usually, 
                // but the CSV parser puts lesson_number into the table. 
                // Let's count where lesson_number > 0
                const { count: lCount, error: lError } = await supabase
                    .from('sessions')
                    .select('*', { count: 'exact', head: true })
                    .eq('roster_id', person.id)
                    .gt('lesson_number', 0);

                if (sError || lError) {
                    console.error(`Error counting for ${person.goalie_name}`, sError || lError);
                    continue;
                }

                // 3. Update Roster
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
            // Delete sessions first (if not cascading)
            const { error: sessionError } = await supabase.from('sessions').delete().eq('roster_id', id);

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
        isLoading,
        currentUser,
        fetchRoster,
        fetchSessions,
        recalculateCounts,
        handleDelete,
        setSessions // exposed for optimistic updates
    };
}
