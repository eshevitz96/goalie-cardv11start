import { createClient as createServerSupabase } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const serverSupabase = createServerSupabase();
        const { data: { user } } = await serverSupabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // 1. Resolve role
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = profile?.role || 'goalie';

        let goalieProfileId = user.id;

        // 2. Parent-mode goalie ID resolution
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

        let pendingLogs = [];

        if (role === 'coach' || role === 'admin') {
            // Coach: fetch pending lessons waiting for coach confirmation
            const { data: logs, error: logsErr } = await supabaseAdmin
                .from('lesson_logs')
                .select('*')
                .eq('status', 'pending')
                .is('coach_confirmed_at', null)
                .order('lesson_date', { ascending: false });

            if (!logsErr && logs) {
                pendingLogs = logs;
            }
        } else {
            // Goalie / Parent: fetch pending lessons waiting for goalie confirmation
            const { data: logs, error: logsErr } = await supabaseAdmin
                .from('lesson_logs')
                .select('*')
                .eq('goalie_id', goalieProfileId)
                .eq('status', 'pending')
                .is('goalie_confirmed_at', null)
                .order('lesson_date', { ascending: false });

            if (!logsErr && logs) {
                pendingLogs = logs;
            }
        }

        return NextResponse.json({
            success: true,
            role,
            goalieProfileId,
            pending: pendingLogs
        });

    } catch (err: any) {
        console.error('Pending lessons API error:', err);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}
