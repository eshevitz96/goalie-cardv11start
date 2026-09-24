import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/utils/supabase/admin';
import { AthleteTrackRepository } from '@/lib/repositories/athleteTrackRepository';

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

        const effectiveUserId = resolvedPublicId || resolvedAuthId || '00000000-0000-0000-0000-000000000000';

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
            const recordId = crypto.randomUUID();

            // Persist to local repository store
            await AthleteTrackRepository.saveEntry({
                id: recordId,
                userId: effectiveUserId,
                date,
                title,
                epistemicType: 'COMPLETED_TRAINING',
                trainingType: (rawType.includes('ice') || rawType.includes('skate')) ? 'on_ice' : (rawType.includes('gym') || rawType.includes('strength') ? 'off_ice' : 'recovery'),
                durationMins: duration,
                confidence: 'EXACT',
                notes,
                rawAthleteReport: notes,
                isActive: true,
                createdAt: new Date().toISOString()
            });

            // Remote Supabase write
            const { data, error } = await supabaseAdmin
                .from('training_sessions')
                .insert({
                    id: recordId,
                    user_id: effectiveUserId,
                    session_date: date,
                    title,
                    duration_minutes: duration,
                    training_type: trainingType,
                    notes_summary: notes,
                    status: 'complete'
                })
                .select()
                .maybeSingle();

            if (error) {
                console.warn("[add_to_training supabase fallback notice]:", error.message);
            }

            return NextResponse.json({
                success: true,
                message: `Added "${title}" to your Training Log.`,
                data: data || { id: recordId, title, date, duration }
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
            const eventId = crypto.randomUUID();

            // Persist to local repository store
            await AthleteTrackRepository.saveEntry({
                id: eventId,
                userId: effectiveUserId,
                date,
                time: time !== 'TBD' ? time : undefined,
                title,
                epistemicType: 'PLANNED_EVENT',
                trainingType: (sport.toLowerCase().includes('ice') || sport.toLowerCase().includes('hockey')) ? 'on_ice' : 'other',
                durationMins: null,
                confidence: 'EXACT',
                location,
                notes,
                rawAthleteReport: notes,
                isActive: true,
                createdAt: new Date().toISOString()
            });

            const { data, error } = await supabaseAdmin
                .from('events')
                .insert({
                    id: eventId,
                    name: title,
                    date: date,
                    location: location,
                    sport: sport,
                    scouting_report: time !== 'TBD' ? `${title} (${time}) • ${notes}` : `${title} • ${notes}`,
                    created_by: resolvedAuthId || null
                })
                .select()
                .maybeSingle();

            if (error) {
                console.warn("[add_to_calendar supabase fallback notice]:", error.message);
            }

            return NextResponse.json({
                success: true,
                message: `Scheduled "${title}" on your Calendar for ${date}.`,
                data: data || { id: eventId, name: title, date }
            });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

    } catch (e: any) {
        console.error("[Goalie Card Actions API Error]:", e);
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
