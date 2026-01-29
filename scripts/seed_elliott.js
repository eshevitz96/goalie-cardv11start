require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Seeding Elliott...");

    // Cleanup
    const emails = ['thegoaliebrand@gmail.com', 'thegoaliebrand+lax@gmail.com'];
    const { data: existing } = await supabase.from('roster_uploads').select('id').or('email.eq.thegoaliebrand@gmail.com,email.eq.thegoaliebrand+lax@gmail.com');

    if (existing && existing.length > 0) {
        const ids = existing.map(r => r.id);
        await supabase.from('sessions').delete().in('roster_id', ids);
        await supabase.from('highlights').delete().in('roster_id', ids);
        await supabase.from('roster_uploads').delete().in('id', ids);
    }

    // Insert Hockey
    const { error: err1 } = await supabase.from('roster_uploads').insert({
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
    if (err1) console.error("Hockey Error", err1);

    // Insert Lax
    // Try same email
    const { error: err2 } = await supabase.from('roster_uploads').insert({
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

    if (err2 && err2.message.includes('unique constraint')) {
        console.log("Using Alias for Lax...");
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

    console.log("Seed Complete.");
}

run();
