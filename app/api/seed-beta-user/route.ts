
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

        const email = 'lukegrasso09@gmail.com'; // Use actual email from demo-utils
        // 1b. Lookup Coach Elliott
        const { data: coach } = await supabase.from('profiles').select('id').eq('email', 'thegoaliebrand@gmail.com').single();
        const elliottId = coach?.id || null; // Fallback to null if not found (shouldn't happen in prod)

        // 1. Check if exists
        const { data: existing } = await supabase.from('roster_uploads').select('id').eq('email', email).maybeSingle();

        if (existing) {
            await supabase.from('roster_uploads').delete().eq('id', existing.id);
        }

        // 2. Insert Beta User - Luke Grasso
        // Using is_claimed: false to bypass RLS for Anon key
        const { data, error } = await supabase.from('roster_uploads').insert({
            goalie_name: 'Luke Grasso',
            parent_name: 'Parent Grasso',
            parent_phone: '555-0199',
            email: email,
            grad_year: 2029,
            team: 'Yale Bulldogs',
            assigned_unique_id: 'GC-8588', // From demo-utils
            is_claimed: false,
            session_count: 20,
            lesson_count: 78, // Lesson 3 of Session 20 means 19 full sessions (4 lessons each) + 2 extra = 78 lessons done. Next is 79.
            assigned_coach_id: elliottId,
            raw_data: {
                dob: '2006-05-15',
                notes: 'Beta User - Luke Grasso',
                sport: 'Lacrosse'
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
