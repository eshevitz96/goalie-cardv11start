import { supabase } from "@/utils/supabase/client";
import { notificationService } from "./notifications";

/**
 * Scheduling Service
 * Handles coach availability, schedule requests, and booking flow
 */
export const schedulingService = {
    /**
     * Fetch incoming schedule requests for a coach
     * Joins with roster_uploads to get goalie info
     */
    async fetchIncomingRequests(coachId: string) {
        // Get roster IDs where this coach is assigned
        const { data: rosterData, error: rosterError } = await supabase
            .from('roster_uploads')
            .select('id, goalie_name')
            .contains('assigned_coach_ids', [coachId]);

        if (rosterError) throw rosterError;
        if (!rosterData || rosterData.length === 0) return [];

        const rosterIds = rosterData.map(r => r.id);
        const rosterMap = new Map(rosterData.map(r => [r.id, r.goalie_name]));

        // Fetch schedule requests for those goalies
        const { data: requests, error: requestsError } = await supabase
            .from('schedule_requests')
            .select('*')
            .in('goalie_id', rosterIds)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (requestsError) throw requestsError;

        // Enrich with goalie names
        return (requests || []).map(req => ({
            ...req,
            goalie_name: rosterMap.get(req.goalie_id) || 'Unknown Goalie'
        }));
    },

    /**
     * Accept a schedule request
     * Updates request status and optionally marks slot as booked
     */
    async acceptRequest(requestId: string, slotId?: string) {
        // Fetch request details first to get goalie_id and date
        const { data: reqData, error: fetchError } = await supabase
            .from('schedule_requests')
            .select('goalie_id, requested_date')
            .eq('id', requestId)
            .single();

        if (fetchError) throw fetchError;

        // Update request status
        const { error: requestError } = await supabase
            .from('schedule_requests')
            .update({ status: 'confirmed' })
            .eq('id', requestId);

        if (requestError) throw requestError;

        // Mark slot as booked if provided
        if (slotId) {
            const { error: slotError } = await supabase
                .from('coach_availability')
                .update({ is_booked: true })
                .eq('id', slotId);

            if (slotError) throw slotError;
        }

        // Trigger Notification
        await notificationService.sendSessionConfirmation(
            reqData.goalie_id,
            "Your Coach", // In a real scenario, we'd fetch the coach's name
            reqData.requested_date
        );

        return { success: true };
    },

    /**
     * Decline a schedule request
     */
    async declineRequest(requestId: string) {
        const { error } = await supabase
            .from('schedule_requests')
            .update({ status: 'declined' })
            .eq('id', requestId);

        if (error) throw error;
        return { success: true };
    },

    /**
     * Fetch coach availability slots
     */
    async fetchCoachAvailability(coachId: string) {
        const { data, error } = await supabase
            .from('coach_availability')
            .select('*')
            .eq('coach_id', coachId)
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Add a new availability slot
     */
    async addAvailabilitySlot(coachId: string, startTime: Date, durationMinutes: number = 60) {
        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

        const { error } = await supabase.from('coach_availability').insert({
            coach_id: coachId,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            is_booked: false
        });

        if (error) throw error;
        return { success: true };
    },

    /**
     * Delete an availability slot
     */
    async deleteAvailabilitySlot(slotId: string) {
        const { error } = await supabase
            .from('coach_availability')
            .delete()
            .eq('id', slotId);

        if (error) throw error;
        return { success: true };
    }
};
