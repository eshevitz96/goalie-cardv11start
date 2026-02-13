import { createClient } from '@supabase/supabase-js';
import { createClient as createServerSupabase } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/create-user
 * Admin-only endpoint that provisions a Supabase Auth user for a goalie.
 * No password is set — the user signs in via OTP/magic link or "forgot password".
 *
 * Body: { email: string, rosterId: string, goalieName?: string }
 */
export async function POST(request: Request) {
    try {
        // 1. Verify caller is authenticated admin
        const serverSupabase = createServerSupabase();
        const { data: { user: caller } } = await serverSupabase.auth.getUser();

        if (!caller) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Check admin role via profiles table
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceKey) {
            return NextResponse.json(
                { success: false, error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Admin check: email allowlist OR profiles.role = 'admin'
        const ADMIN_EMAILS = ['thegoaliebrand@gmail.com'];
        const callerEmail = caller.email?.toLowerCase() || '';

        if (!ADMIN_EMAILS.includes(callerEmail)) {
            const { data: callerProfile } = await supabaseAdmin
                .from('profiles')
                .select('role')
                .eq('id', caller.id)
                .single();

            if (callerProfile?.role !== 'admin') {
                return NextResponse.json(
                    { success: false, error: 'Unauthorized: admin access required' },
                    { status: 403 }
                );
            }
        }

        // 2. Parse request body
        const body = await request.json();
        const { email, rosterId, goalieName } = body;

        if (!email || !rosterId) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: email, rosterId' },
                { status: 400 }
            );
        }

        const emailLower = email.toLowerCase().trim();

        // 3. Check if auth user already exists
        const { data: { users: existingUsers } } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.find(u => u.email?.toLowerCase() === emailLower);

        let authUserId: string;

        if (existingUser) {
            // User already exists in auth — just use their ID
            authUserId = existingUser.id;
        } else {
            // 4. Create Supabase Auth user (no password — user sets their own)
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: emailLower,
                email_confirm: true, // Skip email verification since admin is provisioning
            });

            if (createError) {
                return NextResponse.json(
                    { success: false, error: `Failed to create auth user: ${createError.message}` },
                    { status: 500 }
                );
            }

            authUserId = newUser.user.id;
        }

        // 5. Upsert profiles row (so checkUserStatus finds the user)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: authUserId,
                email: emailLower,
                role: 'goalie',
                goalie_name: goalieName || null,
            }, { onConflict: 'id' });

        if (profileError) {
            console.error('Profile upsert error:', profileError);
            // Non-fatal: auth user was created, profile insert failed
            // The user can still potentially sign in
        }

        // 6. Link roster entry to the auth user
        const { error: linkError } = await supabaseAdmin
            .from('roster_uploads')
            .update({ linked_user_id: authUserId, is_claimed: true })
            .eq('id', rosterId);

        if (linkError) {
            console.error('Roster link error:', linkError);
        }

        return NextResponse.json({
            success: true,
            userId: authUserId,
            message: existingUser
                ? 'Existing auth user linked to roster'
                : 'New user provisioned successfully',
        });

    } catch (err: any) {
        console.error('Admin create-user error:', err);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}
