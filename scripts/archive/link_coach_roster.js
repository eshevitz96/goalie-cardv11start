
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function linkRoster() {
    const EMAIL = "duke.goalie@test.com";
    console.log(`Linking Roster for ${EMAIL}...`);

    // 1. Get Auth User
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error("Auth Admin Error:", authError.message);
        return;
    }

    const user = users.find(u => u.email === EMAIL);
    if (!user) {
        console.error("User not found in Auth! Did you create it?");
        return;
    }
    console.log("Found Auth User:", user.id);

    // 2. Update Roster
    const { error: updateError } = await supabase
        .from('roster_uploads')
        .update({
            linked_user_id: user.id,
            is_claimed: true // Ensure claimed
        })
        .eq('email', EMAIL);

    if (updateError) {
        console.error("Update Error:", updateError.message);
    } else {
        console.log("✅ Successfully linked roster to user.");
    }
}

linkRoster();
