require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, supabaseServiceKey);
const authClient = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log("🧢 Verifying Coach Portal Access...");

    const coachEmail = 'api.sim.coach@goalieguard.com';
    const coachPassword = 'password123';

    // 1. Setup Coach User
    console.log("🛠 Setting up Coach User...");
    // Check if exists
    const { data: { users } } = await adminClient.auth.admin.listUsers();
    let coachUser = users.find(u => u.email === coachEmail);

    if (coachUser) {
        console.log("   -> Found existing coach user.");
        // Ensure profile exists and has role (UPSERT)
        const { error: upsertError } = await adminClient.from('profiles').upsert({
            id: coachUser.id,
            email: coachEmail,
            role: 'coach',
            goalie_name: 'Sim Coach',
            full_name: 'Sim Coach'
        });
        if (upsertError) console.error("❌ Coach Profile Upsert Failed:", upsertError.message);
        else console.log("   -> Profile Upserted Successfully.");
    } else {
        console.log("   -> Creating new coach user...");
        const { data: { user }, error } = await adminClient.auth.admin.createUser({
            email: coachEmail,
            password: coachPassword,
            email_confirm: true,
            user_metadata: { first_name: 'Sim', last_name: 'Coach' }
        });
        if (error) { console.error("❌ Failed to create coach:", error.message); process.exit(1); }
        coachUser = user;

        // Ensure profile exists and has role
        await adminClient.from('profiles').upsert({
            id: coachUser.id,
            email: coachEmail,
            role: 'coach',
            goalie_name: 'Sim Coach',
            full_name: 'Sim Coach'
        });
    }

    // 2. Assign Goalie to Coach
    // We need the ID of the "Simulated Goalie" from previous step. 
    // We can lookup by email: 'api.simulated.goalie@goalieguard.com'
    console.log("🔗 Assigning Goalie to Coach...");

    const { data: goalieRoster } = await adminClient
        .from('roster_uploads')
        .select('id, goalie_name')
        .eq('email', 'api.simulated.goalie@goalieguard.com')
        .single();

    if (!goalieRoster) {
        console.error("❌ Could not find Simulated Goalie to assign.");
        process.exit(1);
    }

    // Update roster to assign this coach
    // Note: Schema might use 'assigned_coach_id' (single) or 'assigned_coach_ids' (array) or a separate table.
    // Let's check schema/code. Inspect schema showed: 'assigned_coach_id' AND 'assigned_coach_ids'.
    // We'll update both to be safe/sure.

    const { error: assignError } = await adminClient
        .from('roster_uploads')
        .update({
            assigned_coach_id: coachUser.id
            // assigned_coach_ids: [coachUser.id] // If array used
        })
        .eq('id', goalieRoster.id);

    if (assignError) {
        console.error("❌ Assignment Failed:", assignError.message);
        process.exit(1);
    }
    console.log(`   -> Assigned '${goalieRoster.goalie_name}' to Coach.`);

    // 3. Verify Access (Login as Coach)
    console.log("🔐 Logging in as Coach...");
    const { data: { session }, error: loginError } = await authClient.auth.signInWithPassword({
        email: coachEmail,
        password: coachPassword
    });

    if (loginError) {
        console.error("❌ Coach Login Failed:", loginError.message);
        process.exit(1);
    }

    // 4. Fetch Roster (Simulating Coach Dashboard)
    // Coach Dashboard likely fetches from 'roster_uploads' where assigned_coach_id = me
    console.log("📋 Fetching Coach's Roster...");

    const { data: myRoster, error: fetchError } = await authClient
        .from('roster_uploads')
        .select('id, goalie_name, team')
        .eq('assigned_coach_id', session.user.id);

    if (fetchError) {
        console.error("❌ Failed to fetch roster:", fetchError.message);
    } else {
        const found = myRoster.find(g => g.id === goalieRoster.id);
        if (found) {
            console.log("✅ Coach Access VERIFIED!");
            console.log(`   -> Found Goalie: ${found.goalie_name} (${found.team})`);
        } else {
            console.error("❌ Goalie NOT found in Coach's active roster return.");
            console.log("   -> Roster returned:", myRoster);
        }
    }
}

run();
