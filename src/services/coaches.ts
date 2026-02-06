import { supabase } from "@/utils/supabase/client";

export const coachesService = {
    async fetchAllProfiles() {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, goalie_name, training_types, pricing_config, development_philosophy')
            .eq('role', 'coach');

        if (error) throw error;
        return data;
    }
};
