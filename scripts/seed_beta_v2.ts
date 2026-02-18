import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Environment Variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface BetaUser {
    goalie_name: string;
    parent_name: string;
    email: string;
    grad_year: number;
    sport: string;
    team: string | null;
    id_code: string;
    session_count: number;
    lesson_count: number;
}

const betaUsers: BetaUser[] = [
    {
        goalie_name: 'Luke Grasso',
        parent_name: 'Tom Grasso',
        email: 'lukegrasso09@gmail.com',
        grad_year: 2006,
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

async function seedBetaUsers() {
    console.log("🌱 Starting Beta User Seeding (v2)...");

    for (const u of betaUsers) {
        console.log(`\nProcessing ${u.goalie_name} (${u.email})...`);

        // 1. Check if Auth User exists
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
            console.error("  ❌ Error listing users:", authError.message);
            continue;
        }

        // Find user by email (case insensitive)
        const authUser = users.find(user => user.email?.toLowerCase() === u.email.toLowerCase());
        let linkedUserId = authUser?.id || null;
        let isClaimed = !!linkedUserId;

        if (linkedUserId) {
            console.log(`  ✅ Found existing Auth User: ${linkedUserId}`);
        } else {
            console.log(`  ℹ️ No existing Auth User found. Roster spot will be unclaimed.`);
        }

        // 2. Upsert Roster Entry
        // We use email as the unique key for upsert effectiveness in this specific script context, 
        // though typically ID is key. Here we want to correct/update specific emails.

        // Check if roster entry exists by email
        const { data: existingRoster } = await supabase
            .from('roster_uploads')
            .select('id')
            .ilike('email', u.email)
            .maybeSingle();

        const payload = {
            goalie_name: u.goalie_name,
            parent_name: u.parent_name,
            email: u.email,
            grad_year: u.grad_year,
            team: u.team,
            assigned_unique_id: u.id_code,
            session_count: u.session_count,
            lesson_count: u.lesson_count,
            is_claimed: isClaimed,
            linked_user_id: linkedUserId, // Link immediately if user exists
            raw_data: {
                sport: u.sport,
                beta_group: true,
                seeded_at: new Date().toISOString()
            },
            payment_status: 'paid'
        };

        let error;
        if (existingRoster) {
            console.log(`  🔄 Updating existing roster entry ${existingRoster.id}...`);
            const { error: updateError } = await supabase
                .from('roster_uploads')
                .update(payload)
                .eq('id', existingRoster.id);
            error = updateError;
        } else {
            console.log(`  🆕 Creating new roster entry...`);
            const { error: insertError } = await supabase
                .from('roster_uploads')
                .insert(payload);
            error = insertError;
        }

        if (error) {
            console.error(`  ❌ Error saving roster:`, error.message);
        } else {
            console.log(`  ✅ Roster saved successfully.`);
        }

        // 3. Upsert Profile if Linked User Exists
        if (linkedUserId) {
            console.log(`  👤 Ensuring Profile for ${linkedUserId}...`);
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: linkedUserId,
                    goalie_name: u.goalie_name,
                    email: u.email,
                    role: 'goalie', // Default role
                    created_at: new Date().toISOString()
                    // Add other profile fields as needed
                }, { onConflict: 'id' });

            if (profileError) {
                console.error(`  ❌ Error upserting profile:`, profileError.message);
            } else {
                console.log(`  ✅ Profile synced.`);
            }
        }
    }

    console.log("\n✨ Beta Seeding Complete!");
}

seedBetaUsers().catch(console.error);
