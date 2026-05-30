import { supabase } from "@/utils/supabase/client";

export const sessionsService = {
    async fetchByRosterIds(rosterIds: string[]) {
        if (rosterIds.length === 0) return [];

        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .in('roster_id', rosterIds)
            .order('date', { ascending: false });

        if (error) throw error;
        return data;
    },

    async fetchAllWithDetails() {
        const { data, error } = await supabase
            .from('sessions')
            .select(`
                *,
                roster:roster_uploads (goalie_name, assigned_unique_id, team)
            `)
            .order('date', { ascending: false });

        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase.from('sessions').delete().eq('id', id);
        if (error) throw error;
    },

    async deleteByRosterId(rosterId: string) {
        const { error } = await supabase.from('sessions').delete().eq('roster_id', rosterId);
        if (error) throw error;
    },

    async deleteAll() {
        const { error } = await supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
    }
};
