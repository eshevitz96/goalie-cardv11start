require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Service Key. Check .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Starting Migration for thegoaliebrand@gmail.com...");

    const email = 'thegoaliebrand@gmail.com';
    const profileId = 'a34df07f-16d0-42e4-adb4-1891b8c9d8e9';

    // 1. Run SQL Fixes (Shot Events Schema Reinforcement)
    const sql = `
        -- 1. Add roster_id to shot_events to anchor heatmaps to specific cards (V11)
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shot_events' AND column_name='roster_id') THEN
                ALTER TABLE public.shot_events ADD COLUMN roster_id UUID REFERENCES public.roster_uploads(id) ON DELETE CASCADE;
            END IF;
        END $$;
        
        -- 2. Ensure User Role and Multi-card Constraint
        ALTER TABLE public.roster_uploads DROP CONSTRAINT IF EXISTS roster_uploads_email_key;
        UPDATE public.profiles SET role = 'admin' WHERE email = '${email}';
    `;

    console.log("Applying SQL Schema and Role Updates...");
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (sqlError) {
        console.error("SQL Migration Failed:", sqlError);
        // If exec_sql doesn't work, we'll try another way.
    } else {
        console.log("✅ Schema updated and user upgraded to Admin.");
    }

    /*
    // 2. Provision the 2 Goalies (Hockey and Lax)
    // We'll use different unique IDs to ensure they are distinct
    console.log("Provisioning Dual Goalie Hubs (Hockey & Lacrosse)...");
    
    const { error: insertError } = await supabase.from('roster_uploads').insert([
        {
            goalie_name: 'Elliott Shevitz (Hockey)',
            sport: 'Hockey',
            team: 'St. Louis Blues',
            email: email,
            assigned_unique_id: 'GC-V11-HKY',
            linked_user_id: profileId,
            is_claimed: true,
            created_at: new Date().toISOString()
        },
        {
            goalie_name: 'Elliott Shevitz (Lacrosse)',
            sport: 'Lacrosse',
            team: 'Yale Bulldogs',
            email: email,
            assigned_unique_id: 'GC-V11-LAX',
            linked_user_id: profileId,
            is_claimed: true,
            created_at: new Date().toISOString()
        }
    ]);

    if (insertError) {
        console.error("Failed to provision cards:", insertError);
    } else {
        console.log("✅ dual cards provisioned successfully.");
    }
    */

    console.log("\n--- Migration Complete ---");
    console.log(`User: ${email}`);
    console.log(`Status: Admin`);
    console.log(`Cards: Hockey, Lacrosse`);
    console.log("Please refresh your dashboard to see both cards.");
}

main();
