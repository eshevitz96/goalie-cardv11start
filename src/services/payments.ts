import { supabase } from '@/utils/supabase/client';

export const paymentsService = {
    async fetchAll() {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async fetchByGoalieId(goalieId: string) {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('goalie_id', goalieId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async fetchByEmail(email: string) {
        // Assuming payments might be linked by email in metadata or user_id mapping
        // This is a placeholder as our schema uses goalie_id (UUID)
        return [];
    },

    async verifyPaymentStatus(goalieId: string) {
        const { data, error } = await supabase
            .from('roster_uploads')
            .select('payment_status, is_claimed')
            .eq('id', goalieId)
            .single();

        if (error) return null;
        return data;
    }
};
