import { supabase } from "@/utils/supabase/client";

export const highlightsService = {
    async fetchAll() {
        const { data, error } = await supabase
            .from('highlights')
            .select('*, roster_uploads(goalie_name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }
};
