import { supabase } from "@/utils/supabase/client";

export const reflectionsService = {
    async fetchByRosterIds(rosterIds: string[]) {
        if (rosterIds.length === 0) return [];

        const { data, error } = await supabase
            .from('reflections')
            .select('roster_id, mood, content, created_at, author_role')
            .in('roster_id', rosterIds)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }
};
