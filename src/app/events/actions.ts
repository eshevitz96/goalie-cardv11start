"use server";

import { createClient } from "@supabase/supabase-js";

/**
 * Server action to add an event, bypassing RLS with service role
 */
export async function addEvent(eventData: {
    name: string;
    date: string;
    location: string;
    sport: string;
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
