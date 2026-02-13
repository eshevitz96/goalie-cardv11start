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
    console.log("Seeding Beta Users...");

    const users = [
        {
            goalie_name: 'Luke Grasso',
            parent_name: 'Tom Grasso',
            email: 'lukegrasso09@gmail.com',
            grad_year: 2006, // DOB Year
            sport: 'Mens Lacrosse',
            team: null,
            id_code: 'GC-BETA-01',
            session_count: 8,
            lesson_count: 4
        },
        {
            goalie_name: 'Elliott Shevitz',
            parent_name: 'Mark Shevitz',
            email: 'eshevitz96@gmail.com',
            grad_year: 1997,
            sport: 'Lacrosse, Hockey',
            team: 'Ladue Rams',
            id_code: 'GC-BETA-02',
            session_count: 12,
            lesson_count: 6
        },
        {
            goalie_name: 'Birdie Wilson',
            parent_name: 'Jennifer Wilson',
            email: 'birdie.wilson@icloud.com',
            grad_year: 2012,
            sport: 'Lacrosse',
            team: 'Eagle Stix/Milton',
            id_code: 'GC-BETA-03',
            session_count: 15,
            lesson_count: 5
        },
        {
            goalie_name: 'Jake Franklin',
            parent_name: 'Kristen Franklin',
            email: 'Kristen.franklin@gwinnettchurch.org',
            grad_year: 2009,
            sport: 'Lacrosse',
            team: null,
            id_code: 'GC-BETA-04',
            session_count: 5,
            lesson_count: 3
        }
    ];

    // Cleanup first
    const emails = users.map(u => u.email);
    console.log("Cleaning up emails:", emails);

    // Fetch IDs to clean related tables if needed
    const { data: existing } = await supabase.from('roster_uploads').select('id, email').in('email', emails);

    if (existing && existing.length > 0) {
        const ids = existing.map(r => r.id);
        console.log("Deleting existing IDs:", ids);
        // Clean related tables (optional/conservative)
        await supabase.from('sessions').delete().in('roster_id', ids);
        await supabase.from('highlights').delete().in('roster_id', ids);

        // Delete Roster Entries
        await supabase.from('roster_uploads').delete().in('id', ids);
    }

    // Insert New Users
    for (const u of users) {
        const { error } = await supabase.from('roster_uploads').insert({
            goalie_name: u.goalie_name,
            parent_name: u.parent_name,
            email: u.email,
            grad_year: u.grad_year,
            team: u.team,
            assigned_unique_id: u.id_code,
            session_count: u.session_count || 0,
            lesson_count: u.lesson_count || 0,
            is_claimed: false,
            raw_data: {
                sport: u.sport,
                beta_group: true
            },
            payment_status: 'paid' // Grant access
        });

        if (error) {
            console.error(`Error inserting ${u.goalie_name}:`, error.message);
        } else {
            console.log(`✅ Seeded: ${u.goalie_name} (${u.email}) -> Code: ${u.id_code}`);
        }
    }

    console.log("\n--- BETA ACCESS CODES ---");
    users.forEach(u => {
        console.log(`${u.goalie_name}: ${u.id_code} (Use Email: ${u.email})`);
    });
}

run();
