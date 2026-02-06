import { supabase } from "@/utils/supabase/client";

export const eventsService = {
    async fetchUpcoming() {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .gte('date', new Date().toISOString())
            .order('date', { ascending: true });

        if (error) throw error;
        return data;
    },

    async fetchRegistrations(goalieId: string) {
        const { data, error } = await supabase
            .from('registrations')
            .select('event_id')
            .eq('goalie_id', goalieId);

        if (error) throw error;
        return data;
    },

    async register(goalieId: string, eventId: string) {
        const { error } = await supabase.from('registrations').insert({
            goalie_id: goalieId,
            event_id: eventId,
            status: 'registered'
        });
        if (error) throw error;
    }
};
