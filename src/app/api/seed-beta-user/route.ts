
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Prevent static generation during build because this mutates DB

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const email = 'eshevitz96@gmail.com';

        // 1. Check if exists
        const { data: existing } = await supabase.from('roster_uploads').select('id').eq('email', email).maybeSingle();

        if (existing) {
            await supabase.from('roster_uploads').delete().eq('id', existing.id);
        }

        // 2. Insert Beta User
        // Using is_claimed: false to bypass RLS for Anon key
        const { data, error } = await supabase.from('roster_uploads').insert({
            goalie_name: 'Elliott Shevitz (Beta)',
            parent_name: 'David Shevitz',
            parent_phone: '555-0199',
            email: email,
            grad_year: 2014, // PRO
            team: 'Beta Testers',
            assigned_unique_id: 'GC-BETA-01',
            is_claimed: false,
            session_count: 5,
            lesson_count: 0,
            raw_data: {
                dob: '1996-05-15', // REQUIRED for Simple Login
                notes: 'Added via Beta API',
                sport: 'Hockey'
            },
            payment_status: 'paid'
        }).select().single();

        if (error) {
            console.error("Insert Error:", error);
            return NextResponse.json({ success: false, error: error.message, details: error }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Beta User Seeded", data });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
