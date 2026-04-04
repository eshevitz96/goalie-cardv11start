
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixUser(email: string) {
    console.log(`🔍 Fixing user: ${email}...`);

    // 1. Fetch
    const { data: users, error } = await supabase
        .from('roster_uploads')
        .select('*')
        .ilike('email', email);

    if (error || !users || users.length === 0) {
        console.error("❌ User not found.");
        return;
    }

    const targetUser = users[0];
    console.log(`✅ Found User: ${targetUser.goalie_name} (${targetUser.id})`);

    // 2. Prepare Updates
    // Fix Name if suffix persists
    let newName = targetUser.goalie_name;
    if (newName.includes('(Pro)')) {
        newName = newName.replace(' (Pro)', '').trim();
    }

    // Set Setup Complete
    const raw = targetUser.raw_data || {};
    const newRaw = { ...raw, setup_complete: true };

    // 3. Update
    const { error: updateError } = await supabase
        .from('roster_uploads')
        .update({
            goalie_name: newName,
            raw_data: newRaw
        })
        .eq('id', targetUser.id);

    if (updateError) console.error("❌ Update Failed:", updateError.message);
    else console.log(`✅ SUCCESS: Name set to "${newName}" & Setup Complete = TRUE.`);
}

const email = process.argv[2] || 'thegoaliebrand@gmail.com';
fixUser(email);
