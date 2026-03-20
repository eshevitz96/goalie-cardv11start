import { supabase } from "@/utils/supabase/client";

/**
 * Notification Service
 * Handles triggers for Email, SMS, and In-App notifications
 */
export const notificationService = {
    /**
     * Notify goalie of a session confirmation
     */
    async sendSessionConfirmation(goalieId: string, coachName: string, sessionDate: string) {
        console.log(`[Notification] Sending session confirmation to ${goalieId} via Email/SMS. Coach: ${coachName}, Date: ${sessionDate}`);
        
        // Future: Integrate with Twilio/SendGrid/Resend
        // For now, we record the notification in the DB
        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: goalieId,
                title: "Session Confirmed",
                content: `Your session with ${coachName} on ${new Date(sessionDate).toLocaleDateString()} has been confirmed.`,
                type: 'session_confirmation',
                status: 'unread'
            });

        if (error) {
            console.error("Failed to record notification:", error);
            return { success: false, error };
        }

        return { success: true };
    },

    /**
     * Notify coach of a new recruiting request
     */
    async sendRecruitingRequestUpdate(coachId: string, goalieName: string) {
        console.log(`[Notification] Notifying coach ${coachId} about recruiting request from ${goalieName}`);
        
        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: coachId,
                title: "New Recruiting Request",
                content: `${goalieName} has requested Recruiting Consulting services.`,
                type: 'recruiting_request',
                status: 'unread'
            });

        if (error) {
            console.error("Failed to record notification:", error);
            return { success: false, error };
        }

        return { success: true };
    }
};
