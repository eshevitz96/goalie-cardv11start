require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const authClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("📅 Verifying Event Visibility...");

    // 1. Log in as Coach Elliott
    const email = 'elliott@goalieguard.com';
    const password = 'password123';
    const { data: { session: coachSession }, error: loginError } = await authClient.auth.signInWithPassword({
        email, password
    });

    if (loginError) { console.error("❌ Coach Login Failed"); process.exit(1); }
    console.log("✅ Coach Logged In.");

    // 2. Coach Creates Public Event
    const eventName = `Open Skate ${Math.floor(Math.random() * 1000)}`;
    const { data: event, error: createError } = await authClient
        .from('events')
        .insert({
            name: eventName,
            date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            location: 'Main Arena',
            status: 'upcoming',
            sport: 'Hockey',
            created_by: coachSession.user.id
        })
        .select()
        .single();

    if (createError) {
        console.error("❌ Event Creation Failed (RLS?):", createError.message);
        // If RLS fails, we might need a policy for 'Coaches can create events'
    } else {
        console.log(`✅ Event Created: ${event.name} (ID: ${event.id})`);
    }

    // 3. Log in as Goalie (Simulated)
    const goalieEmail = 'api.simulated.goalie@goalieguard.com';
    const goalieClient = createClient(supabaseUrl, supabaseAnonKey);
    const { error: goalieLoginError } = await goalieClient.auth.signInWithPassword({
        email: goalieEmail, password: 'password123'
    });

    if (goalieLoginError) { console.error("❌ Goalie Login Failed:", goalieLoginError.message); process.exit(1); }
    console.log("✅ Goalie Logged In.");

    // 4. Goalie Checks for Event with Role Filtering Logic
    // We want to fetch events where:
    // - Created by an Admin/Coach (Global)
    // - OR Created by Me (Personal)

    const { data: events, error: fetchError } = await goalieClient
        .from('events')
        .select('*, profiles!events_created_by_fkey(role)')
        .eq('id', event.id);

    if (fetchError) {
        console.error("❌ Goalie Fetch Failed:", fetchError.message);
    } else if (events.length > 0) {
        console.log("✅ Goalie Fetched Event:", events[0].name);
        console.log("   -> Created By Role:", events[0].profiles?.role);
    } else {
        console.error("❌ Goalie Could NOT fetch event.");
    }

    // Cleanup
    if (event) {
        await adminClient.from('events').delete().eq('id', event.id);
        console.log("🧹 Cleanup: Event deleted.");
    }
}

run();
