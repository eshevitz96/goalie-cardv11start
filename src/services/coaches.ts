import { supabase } from "@/utils/supabase/client";

export const coachesService = {
    async fetchAllProfiles() {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, goalie_name')
            .eq('role', 'coach');

        if (error) throw error;
        return data;
    }
};
