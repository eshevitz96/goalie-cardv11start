"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";

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
 * Server action to fetch all events, bypassing RLS
 */
export async function getEvents() {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
        .from('events')
        .select('*')
        .order('date', { ascending: true });

    if (error) {
        console.error("[getEvents] Error:", error);
        return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
}

/**
 * Server action to update an existing event
 */
export async function updateEvent(eventId: string, eventData: {
    name: string;
    date: string;
    location: string;
    sport: string;
    scouting_report?: string;
}) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
        .from('events')
        .update({
            name: eventData.name,
            date: eventData.date,
            location: eventData.location,
            sport: eventData.sport,
            scouting_report: eventData.scouting_report
        })
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
        const supabaseServer = createSupabaseServerClient();
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
