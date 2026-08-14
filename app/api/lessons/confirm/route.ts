import { createClient as createServerSupabase } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const serverSupabase = createServerSupabase();
        const { data: { user } } = await serverSupabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { lessonId, takeaway, focusArea } = body;

        if (!lessonId || !takeaway || typeof takeaway !== 'string' || !takeaway.trim()) {
            return NextResponse.json(
                { success: false, error: 'Missing or invalid fields: lessonId and takeaway are required.' },
                { status: 400 }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // 1. Resolve role server-side (FIX 3)
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = profile?.role || 'goalie';

        let goalieProfileId = user.id;

        // 2. Parent-mode goalie ID resolution (FIX 3)
        if (role === 'parent' && user.email) {
            const { data: parentRosters } = await supabaseAdmin
                .from('roster_uploads')
                .select('linked_user_id')
                .ilike('guardian_email', user.email);

            if (parentRosters && parentRosters.length > 0) {
                const activeRoster = parentRosters.find(r => r.linked_user_id) || parentRosters[0];
                goalieProfileId = activeRoster.linked_user_id || user.id;
            }
        }

        // 3. Fetch lesson log to verify existence and check ownership (FIX 3)
        const { data: lessonLog, error: fetchErr } = await supabaseAdmin
            .from('lesson_logs')
            .select('*')
            .eq('id', lessonId)
            .maybeSingle();

        if (fetchErr || !lessonLog) {
            return NextResponse.json(
                { success: false, error: 'Lesson log not found' },
                { status: 404 }
            );
        }

        // 4. Row Ownership verification: Goalie/Parent can only write if they own the lesson
        if (role !== 'coach' && role !== 'admin') {
            if (lessonLog.goalie_id !== goalieProfileId) {
                return NextResponse.json(
                    { success: false, error: 'Access forbidden: You do not own this lesson log.' },
                    { status: 403 }
                );
            }
        }

        // 5. Invoke the atomic, idempotent RPC function (FIX 1 & FIX 2)
        const side = (role === 'coach' || role === 'admin') ? 'coach' : 'goalie';
        const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc('confirm_lesson', {
            p_log_id: lessonId,
            p_side: side,
            p_takeaway: takeaway.trim(),
            p_focus_area: focusArea || null
        });

        if (rpcErr) {
            console.error('RPC confirm_lesson error:', rpcErr);
            return NextResponse.json(
                { success: false, error: rpcErr.message || 'Failed to execute confirmation' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Lesson updated successfully',
            data: rpcRes
        });

    } catch (err: any) {
        console.error('Confirm lesson API error:', err);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}
