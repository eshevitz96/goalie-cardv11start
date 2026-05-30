import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        console.log("Seeding with key ending in...", supabaseKey.slice(-5));

        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Clean Slate
        const emails = ['thegoaliebrand@gmail.com', 'thegoaliebrand+lax@gmail.com'];
        const { data: existing } = await supabase.from('roster_uploads').select('id').or('email.eq.thegoaliebrand@gmail.com,email.eq.thegoaliebrand+lax@gmail.com');
        if (existing) {
            const ids = existing.map(r => r.id);
            await supabase.from('sessions').delete().in('roster_id', ids);
            await supabase.from('roster_uploads').delete().in('id', ids);
        }

        // Insert Hockey
        await supabase.from('roster_uploads').insert({
            goalie_name: 'Elliott Shevitz (Pro)',
            parent_name: 'David Shevitz',
            parent_phone: '555-0100',
            email: 'thegoaliebrand@gmail.com',
            grad_year: 2020,
            team: 'St. Louis Blues',
            assigned_unique_id: 'GC-8001',
            session_count: 0,
            lesson_count: 0,
            is_claimed: false,
            raw_data: { sport: 'Hockey' },
            payment_status: 'paid'
        });

        // Insert Lax
        // Attempt same email. If fails, try alias.
        const { error } = await supabase.from('roster_uploads').insert({
            goalie_name: 'Elliott Shevitz (Pro)',
            parent_name: 'David Shevitz',
            parent_phone: '555-0100',
            email: 'thegoaliebrand@gmail.com',
            grad_year: 2020,
            team: 'Yale Bulldogs',
            assigned_unique_id: 'GC-8002',
            session_count: 0,
            lesson_count: 0,
            is_claimed: false,
            raw_data: { sport: 'Lacrosse' },
            payment_status: 'paid'
        });

        if (error && error.message.includes('unique')) {
            await supabase.from('roster_uploads').insert({
                goalie_name: 'Elliott Shevitz (Pro)',
                parent_name: 'David Shevitz',
                parent_phone: '555-0100',
                email: 'thegoaliebrand+lax@gmail.com',
                grad_year: 2020,
                team: 'Yale Bulldogs',
                assigned_unique_id: 'GC-8002',
                session_count: 0,
                lesson_count: 0,
                is_claimed: false,
                raw_data: { sport: 'Lacrosse' },
                payment_status: 'paid'
            });
        }

        return NextResponse.json({ success: true, message: "Elliott Seeded" });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
