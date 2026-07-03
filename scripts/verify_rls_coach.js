require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in env.");
    process.exit(1);
}

// Helper function to create client
function createAnonClient() {
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
    });
}

async function run() {
    console.log("=== Starting Automated Coach Engine RLS Verification ===");
    
    // Instantiate clients
    const clientA = createAnonClient();
    const clientB = createAnonClient();

    // 1. Authenticate Client A (test.goalie@goaliecard.app)
    console.log("\n1. Authenticating User A (test.goalie@goaliecard.app)...");
    const { data: authA, error: authAError } = await clientA.auth.signInWithPassword({
        email: 'test.goalie@goaliecard.app',
        password: 'password123'
    });

    if (authAError) {
        console.error("User A authentication failed:", authAError.message);
        process.exit(1);
    }
    const userIdA = authA.user.id;
    console.log(`User A authenticated successfully. UUID: ${userIdA}`);

    // Check if contract is seeded
    const { data: contractA, error: contractErr } = await clientA
        .from('contracts')
        .select('*')
        .eq('user_id', userIdA)
        .eq('status', 'active')
        .maybeSingle();

    if (contractErr) {
        console.error("Error checking contracts:", contractErr);
    }

    if (!contractA) {
        console.log(`\n⚠️  IMPORTANT: No active contract seeded for User A (${userIdA}) in the 'contracts' table.`);
        console.log(`Please seed a contract with user_id = '${userIdA}', status = 'active', name = 'Gladiators' before executing full integration.`);
        console.log("We will proceed using a dummy UUID for the RLS insert/select tests.\n");
    } else {
        console.log(`✅ Active Contract found: ID = ${contractA.id}, Name = ${contractA.name}`);
    }

    const contractId = contractA ? contractA.id : '5c60360d-6ea8-4db3-ac00-ec4065681e9a';

    // 2. Profile RLS Writes and Reads
    console.log("\n2. Testing profile read/write RLS...");
    const profileRow = {
        user_id: userIdA,
        baselines: { balance: 4.5, landing: 4.5, conditioning: 4.0 },
        constraints_notes: "Slight right groin tightness"
    };

    const { data: upsertProf, error: upsertProfErr } = await clientA
        .from('athlete_profiles')
        .upsert(profileRow)
        .select();

    if (upsertProfErr) {
        console.error("❌ Failed to upsert athlete profile:", upsertProfErr.message);
    } else {
        console.log("✅ Successfully upserted profile:", upsertProf[0]);
    }

    // Performance Model RLS Writes and Reads
    const modelRow = {
        user_id: userIdA,
        model: {
            balance: 4.5,
            landing: 4.5,
            conditioning: 4.0,
            recent_fatigue_level: 'moderate',
            total_completed_missions: 1
        }
    };
    const { data: upsertModel, error: upsertModelErr } = await clientA
        .from('performance_models')
        .upsert(modelRow)
        .select();

    if (upsertModelErr) {
        console.error("❌ Failed to upsert performance model:", upsertModelErr.message);
    } else {
        console.log("✅ Successfully upserted performance model:", upsertModel[0]);
    }

    // 3. Mission Generation, Upsert, and Same-Day Regeneration Conflict tests
    console.log("\n3. Testing Mission generation and same-day regeneration...");
    const todayIso = new Date().toISOString().split('T')[0];

    const missionA1 = {
        id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        user_id: userIdA,
        contract_id: contractId,
        mission_date: todayIso,
        day_number: 1,
        title: 'Initial Day 1 Mission',
        directive: 'Keep alignments clean.',
        bottleneck: 'landing_quality',
        readiness: { energy: 7, soreness: { legs: false, core: false, upper: false }, location: 'home', time_minutes: 30 },
        blocks: { blocks: [], coach_focus: 'Focus on toes', success_criteria: 'Soft sound on contact' },
        status: 'assigned'
    };

    // First mission insert
    const { data: insertM1, error: insertM1Err } = await clientA
        .from('missions')
        .upsert(missionA1, { onConflict: 'user_id,mission_date' })
        .select();

    if (insertM1Err) {
        console.error("❌ Failed to save initial mission:", insertM1Err.message);
    } else {
        console.log("✅ Successfully saved initial mission. Day number:", insertM1[0].day_number);
    }

    // Same-day regeneration: insert with same user_id and date but updated content/day_number
    console.log("Regenerating mission for today...");
    const missionA2 = {
        id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        user_id: userIdA,
        contract_id: contractId,
        mission_date: todayIso,
        day_number: 1, // Must remain 1
        title: 'Regenerated Day 1 Mission',
        directive: 'Focus on balance pivots.',
        bottleneck: 'right_side_balance',
        readiness: { energy: 8, soreness: { legs: false, core: false, upper: false }, location: 'gym', time_minutes: 60 },
        blocks: { blocks: [], coach_focus: 'Stay centered', success_criteria: 'Keep hips aligned' },
        status: 'assigned'
    };

    const { data: insertM2, error: insertM2Err } = await clientA
        .from('missions')
        .upsert(missionA2, { onConflict: 'user_id,mission_date' })
        .select();

    if (insertM2Err) {
        console.error("❌ Same-day regeneration failed:", insertM2Err.message);
    } else {
        console.log("✅ Same-day regeneration succeeded!");
        console.log("New title:", insertM2[0].title);
        console.log("New bottleneck:", insertM2[0].bottleneck);
        console.log("Asserting day number remains constant...");
        if (insertM2[0].day_number === 1) {
            console.log("✅ Assertion passed! Day number remained 1.");
        } else {
            console.error(`❌ Assertion failed! Day number changed from 1 to ${insertM2[0].day_number}`);
        }
    }

    // 4. Submit reflection delta to learning_updates
    console.log("\n4. Testing reflection delta submissions...");
    const learningUpdate = {
        user_id: userIdA,
        mission_id: missionA2.id,
        deltas: {
            reflection: { energy: 8, balanceRating: 7, landingRating: 8, conditioningRating: 7 },
            deltas: { balanceDelta: 0.5, landingDelta: 0, conditioningDelta: 0 },
            insights: ["Baseline balance increased."]
        }
    };

    const { data: insertLearn, error: insertLearnErr } = await clientA
        .from('learning_updates')
        .insert(learningUpdate)
        .select();

    if (insertLearnErr) {
        console.error("❌ Failed to insert learning update:", insertLearnErr.message);
    } else {
        console.log("✅ Successfully saved learning update. Deltas recorded:", insertLearn[0].deltas);
    }

    // 5. Cross-User Negative RLS Privacy Test (User B attempts to read/write User A's data)
    console.log("\n5. Testing Cross-User RLS Privacy (Negative Tests)...");
    
    // Authenticate Client B
    console.log("Authenticating User B (privacy.tester@goaliecard.app)...");
    const { data: authB, error: authBError } = await clientB.auth.signInWithPassword({
        email: 'privacy.tester@goaliecard.app',
        password: 'password123'
    });

    if (authBError) {
        console.error("User B authentication failed:", authBError.message);
        process.exit(1);
    }
    const userIdB = authB.user.id;
    console.log(`User B authenticated successfully. UUID: ${userIdB}`);

    // User B tries to select User A's missions
    console.log(`User B trying to select User A's missions (user_id = '${userIdA}')...`);
    const { data: readMissionsB, error: readMissionsBErr } = await clientB
        .from('missions')
        .select('*')
        .eq('user_id', userIdA);

    if (readMissionsBErr) {
        console.log("✅ RLS blocked read attempt with error:", readMissionsBErr.message);
    } else {
        console.log(`Results returned for User A's missions:`, readMissionsB);
        if (readMissionsB.length === 0) {
            console.log("✅ RLS successfully restricted query! 0 rows returned.");
        } else {
            console.error("❌ SECURITY FAILURE: User B was able to read User A's missions!");
        }
    }

    // User B tries to read User A's profile
    console.log(`User B trying to read User A's profile...`);
    const { data: readProfileB } = await clientB
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', userIdA);

    if (readProfileB && readProfileB.length === 0) {
        console.log("✅ RLS successfully restricted profile read! 0 rows returned.");
    } else {
        console.error("❌ SECURITY FAILURE: User B was able to read User A's profile!", readProfileB);
    }

    // User B tries to write to User A's profile
    console.log(`User B trying to write to User A's profile...`);
    const { error: writeProfileBErr } = await clientB
        .from('athlete_profiles')
        .upsert({ user_id: userIdA, baselines: { balance: 10 } });

    if (writeProfileBErr) {
        console.log("✅ RLS successfully blocked write attempt:", writeProfileBErr.message);
    } else {
        console.error("❌ SECURITY FAILURE: User B was allowed to write/edit User A's profile!");
    }

    console.log("\n=== Automated Coach Engine RLS Verification Complete ===");
}

run();
