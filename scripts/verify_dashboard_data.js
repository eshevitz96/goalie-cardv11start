require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const authClient = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log("📊 Verifying Dashboard Data Fetch (Simulating useGoalieData)...");

    // 1. Log in as "Simulated Goalie"
    const email = 'api.simulated.goalie@goalieguard.com';
    const password = 'password123';

    const { data: { session }, error: loginError } = await authClient.auth.signInWithPassword({
        email, password
    });

    if (loginError) {
        console.error("❌ Login Failed:", loginError.message);
        process.exit(1);
    }
    console.log("✅ Logged In.");

    // 2. Fetch Roster
    const { data: roster, error: rosterError } = await authClient
        .from('roster_uploads')
        .select('*')
        .eq('linked_user_id', session.user.id)
        .single();

    if (rosterError) {
        console.error("❌ Roster Fetch Failed:", rosterError.message);
        process.exit(1);
    }

    // 3. Fetch Coach Details (The bit we fixed)
    if (roster.assigned_coach_id) {
        console.log(`   -> Fetching Coach ID: ${roster.assigned_coach_id}`);
        // Use maybeSingle to avoid crash, or just select to see what's inconsistent
        const { data: coaches, error: coachError } = await authClient
            .from('profiles')
            .select('id, goalie_name, bio, philosophy, pricing_config')
            .eq('id', roster.assigned_coach_id);

        if (coachError) {
            console.error("❌ Coach Fetch Failed:", coachError.message);
        } else if (coaches.length > 1) {
            console.error(`❌ Duplicate Profiles found for ID ${roster.assigned_coach_id} (Count: ${coaches.length})`);
        } else if (coaches.length === 0) {
            console.warn("⚠️ Coach Profile Not Found (Row missing or RLS blocking).");

            // Check with Admin Client to confirm existence
            const adminClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
            const { data: adminCoaches } = await adminClient
                .from('profiles')
                .select('id')
                .eq('id', roster.assigned_coach_id);

            if (adminCoaches && adminCoaches.length > 0) {
                console.error("🚨 CRITICAL: Profile EXISTS but hidden by RLS!");
            } else {
                console.error("❌ CRITICAL: Profile does NOT exist in DB (Orphaned ID).");
            }

        } else {
            const coach = coaches[0];
            console.log("✅ Coach Data Fetched:");
            console.log(`   - Name: ${coach.goalie_name}`);
            console.log(`   - Bio: ${coach.bio ? 'Present' : 'Missing'}`);
            console.log(`   - Philosophy: ${coach.philosophy ? 'Present' : 'Missing'}`);
            console.log(`   - Pricing: ${coach.pricing_config ? 'Present' : 'Missing'}`);
        }
    } else {
        console.warn("⚠️ No Coach Assigned to this Goalie.");
    }

    // 4. Fetch Events (Verification)
    console.log("📅 Fetching Events...");
    // Logic from hook: fetch all events >= today
    const { data: events, error: eventsError } = await authClient
        .from('events')
        .select('*')
        .gte('date', new Date().toISOString())
        .limit(3);

    if (eventsError) {
        console.error("❌ Events Fetch Failed:", eventsError.message);
    } else {
        console.log(`✅ Fetched ${events.length} Upcoming Events.`);
    }
}

run();
