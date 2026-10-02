"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import { verifyCoachAuthorization } from "@/app/training/book/actions";

/**
 * Server action to add an event, bypassing RLS with service role
 */
export async function addEvent(eventData: {
    name: string;
    date: string;
    location: string;
    sport: string;
    scouting_report?: string;
    price?: number;
    image?: string;
    userId?: string; // Optional: Link creator to event
}) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Create Event
    const { data: event, error } = await supabaseAdmin.from('events').insert({
        name: eventData.name,
        date: eventData.date,
        location: eventData.location,
        sport: eventData.sport,
        scouting_report: eventData.scouting_report || null,
        price: eventData.price || 0,
        image: eventData.image || "from-zinc-500 to-zinc-700",
        created_by: eventData.userId || null
    }).select().single();

    if (error) {
        console.error("[addEvent] Error:", error);
        return { success: false, error: error.message };
    }

    // 2. Auto-Register Creator (if User ID provided)
    if (eventData.userId && event) {
        try {
            await supabaseAdmin.from('registrations').insert({
                goalie_id: eventData.userId,
                event_id: event.id,
                status: 'registered'
            });
        } catch (regErr) {
            console.warn("Auto-registration failed:", regErr);
            // Don't fail the whole action, event was created
        }
    }

    return { success: true };
}

/**
 * Server action to fetch events, scoped to caller's own events (+ coach/admin sees all)
 */
export async function getEvents() {
    try {
        const supabaseServer = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

        if (authError || !user) {
            return { success: false, data: [], error: "Authentication required." };
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check if caller is coach or admin
        const [{ data: prof }, { data: usr }] = await Promise.all([
            supabaseAdmin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
            supabaseAdmin.from('users').select('role').eq('auth_user_id', user.id).maybeSingle()
        ]);

        const role = prof?.role || usr?.role;
        const isCoach = role === 'coach' || role === 'admin' || user.email === 'eshevitz96@gmail.com';

        let query = supabaseAdmin
            .from('events')
            .select('*')
            .order('date', { ascending: true });

        if (!isCoach) {
            query = query.eq('created_by', user.id);
        }

        const { data, error } = await query;

        if (error) {
            console.error("[getEvents] Error:", error);
            return { success: false, data: [], error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (err: any) {
        console.error("[getEvents] Error:", err);
        return { success: false, data: [], error: err.message };
    }
}

/**
 * Server action to update an existing event
 */
export async function updateEvent(eventId: string, eventData: {
    name?: string;
    date?: string;
    location?: string;
    sport?: string;
    scouting_report?: string;
    shared_with_coach?: boolean;
}) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const updatePayload: any = {};
    if (eventData.name !== undefined) updatePayload.name = eventData.name;
    if (eventData.date !== undefined) updatePayload.date = eventData.date;
    if (eventData.location !== undefined) updatePayload.location = eventData.location;
    if (eventData.sport !== undefined) updatePayload.sport = eventData.sport;
    if (eventData.scouting_report !== undefined) updatePayload.scouting_report = eventData.scouting_report;
    if (eventData.shared_with_coach !== undefined) updatePayload.shared_with_coach = eventData.shared_with_coach;

    const { error } = await supabaseAdmin
        .from('events')
        .update(updatePayload)
        .eq('id', eventId);

    if (error) {
        console.error("[updateEvent] Error:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Server action to delete an event, with ownership validation
 */
export async function deleteEvent(eventId: string) {
    if (!eventId) return { success: false, error: "Missing Event ID" };

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        // 1. Get current user using the correct server-side client (reads cookies)
        const supabaseServer = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

        if (authError || !user) {
            console.error("[deleteEvent] Auth error:", authError);
            return { success: false, error: "Authentication required." };
        }

        // 2. Fetch event to check ownership
        const { data: event, error: fetchError } = await supabaseAdmin
            .from('events')
            .select('created_by')
            .eq('id', eventId)
            .single();

        if (fetchError || !event) {
            return { success: false, error: "Event not found." };
        }

        // 3. Validate ownership
        if (event.created_by !== user.id) {
            return { success: false, error: "Unauthorized: You do not own this event." };
        }

        // 4. Perform deletion
        const { error: deleteError } = await supabaseAdmin
            .from('events')
            .delete()
            .eq('id', eventId);

        if (deleteError) {
            console.error("[deleteEvent] error:", deleteError);
            return { success: false, error: deleteError.message };
        }

        return { success: true };
    } catch (err: any) {
        console.error("[deleteEvent] exception:", err);
        return { success: false, error: err.message };
    }
}
export async function pruneEventVideo(eventId: string, videoUrl: string) {
    if (!eventId || !videoUrl) return { success: false, error: "Missing data" };

    try {
        const supabaseServer = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Unauthorized: Active session required" };
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Verify access: caller owns event or is coach
        const { data: eventData, error: eventFetchError } = await supabaseAdmin
            .from('events')
            .select('id, created_by, roster_id')
            .eq('id', eventId)
            .maybeSingle();

        if (eventFetchError || !eventData) {
            return { success: false, error: "Event not found" };
        }

        if (eventData.created_by !== user.id) {
            const coachAuth = await verifyCoachAuthorization();
            if (!coachAuth.isAuthorized) {
                return { success: false, error: "Forbidden: Not authorized to modify this event" };
            }
        }

        // 2. Extract relative storage path
        let storagePath = videoUrl;
        if (videoUrl.includes('/game-film/')) {
            storagePath = videoUrl.split('/game-film/')[1];
        } else if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
            const parts = videoUrl.split('/');
            storagePath = parts.slice(-2).join('/'); // e.g. user_id/filename.mp4
        }

        // 3. Delete from Storage
        const { error: storageError } = await supabaseAdmin.storage
            .from('game-film')
            .remove([storagePath]);

        if (storageError) {
            console.warn("[pruneEventVideo] Storage removal warning:", storageError);
        }

        // 4. Update Event Record to detach video and mark as 'clipped'
        const { error: dbError } = await supabaseAdmin
            .from('events')
            .update({ 
                video_url: null, 
                is_charted: true,
                scouting_report: 'Full Game Tape Pruned - Highlights preserved in V11 Reels.' 
            })
            .eq('id', eventId);

        if (dbError) throw dbError;

        return { success: true };
    } catch (err: any) {
        console.error("Prune Video Error:", err);
        return { success: false, error: err.message };
    }
}
