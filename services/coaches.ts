import { supabase } from "@/utils/supabase/client";

export const coachesService = {
    async fetchAllProfiles() {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, goalie_name')
            .or('role.eq.coach,role.eq.admin');

        if (error) throw error;
        return data;
    }
};
