import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, userId, userEmail, payload } = body;

        if (!action || !payload) {
            return NextResponse.json({ error: 'Missing action or payload' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Resolve authorized User ID
        let resolvedPublicId: string | null = null;
        let resolvedAuthId: string | null = null;

        if (userId && userId !== '00000000-0000-0000-0000-000000000000') {
            const { data: u } = await supabaseAdmin
                .from('users')
                .select('id, auth_user_id, email')
                .or(`id.eq.${userId},auth_user_id.eq.${userId}`)
                .maybeSingle();
            if (u) {
                resolvedPublicId = u.id;
                resolvedAuthId = u.auth_user_id || u.id;
            }
        }

        if (!resolvedPublicId && userEmail) {
            const { data: u } = await supabaseAdmin
                .from('users')
                .select('id, auth_user_id, email')
                .ilike('email', userEmail.trim())
                .maybeSingle();
            if (u) {
                resolvedPublicId = u.id;
                resolvedAuthId = u.auth_user_id || u.id;
            }
        }

        // Fallback to active athlete
        if (!resolvedPublicId) {
            const { data: u } = await supabaseAdmin
                .from('users')
                .select('id, auth_user_id, email')
                .ilike('email', '%eshevitz96%')
                .maybeSingle();
            if (u) {
                resolvedPublicId = u.id;
                resolvedAuthId = u.auth_user_id || u.id;
            }
        }

        const effectiveUserId = resolvedPublicId || resolvedAuthId;
        if (!effectiveUserId) {
            return NextResponse.json({ error: 'Unauthorized user' }, { status: 401 });
        }

        // 2. Handle Action: Add to Training
        if (action === 'add_to_training') {
            const date = payload.date || new Date().toISOString().slice(0, 10);
            const title = payload.title || 'Training Session';
            const duration = parseInt(payload.duration, 10) || 30;
            const rawType = (payload.type || '').toLowerCase();
            const validTypes = ['private', 'team', 'wall_ball', 'footwork', 'reaction', 'film', 'other', 'coach_mission'];
            const trainingType = validTypes.includes(rawType) 
                ? rawType 
                : rawType.includes('condition') || rawType.includes('foot') 
                    ? 'footwork' 
                    : rawType.includes('recover') || rawType.includes('react')
                        ? 'reaction'
                        : 'other';
            const notes = payload.notes || payload.details || '';

            const { data, error } = await supabaseAdmin
                .from('training_sessions')
                .insert({
                    user_id: resolvedPublicId || effectiveUserId,
                    session_date: date,
                    title,
                    duration_minutes: duration,
                    training_type: trainingType,
                    notes_summary: notes,
                    status: 'complete'
                })
                .select()
                .single();

            if (error) {
                console.error("[add_to_training error]:", error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: `Added "${title}" to your Training Log.`,
                data
            });
        }

        // 3. Handle Action: Add to Calendar
        if (action === 'add_to_calendar') {
            const date = payload.date || new Date().toISOString().slice(0, 10);
            const title = payload.title || payload.name || 'Scheduled Event';
            const location = payload.location || 'Local Rink / Gym';
            const sport = payload.sport || 'Hockey';
            const time = payload.time || 'TBD';
            const notes = payload.notes || payload.details || payload.scouting_report || '';

            const { data, error } = await supabaseAdmin
                .from('events')
                .insert({
                    name: title,
                    date: date,
                    location: location,
                    sport: sport,
                    scouting_report: time !== 'TBD' ? `${title} (${time}) • ${notes}` : `${title} • ${notes}`,
                    created_by: resolvedAuthId || null
                })
                .select()
                .single();

            if (error) {
                console.error("[add_to_calendar error]:", error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: `Scheduled "${title}" on your Calendar for ${date}.`,
                data
            });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

    } catch (e: any) {
        console.error("[Goalie Card Actions API Error]:", e);
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
