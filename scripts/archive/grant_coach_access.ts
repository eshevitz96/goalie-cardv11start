
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function grantCoachAccess() {
    const EMAIL = "duke.goalie@test.com";
    console.log(`Granting COACH access to ${EMAIL}...`);

    // 1. Get User ID
    // Since we don't have direct access to auth.users without admin API in limited client (or we do with service role),
    // let's try to query profiles first.

    // Actually, service role client CAN query auth.users if needed, but profiles is easier if it exists.
    // Assuming profile exists from previous login/setup.

    const { data: profiles, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', EMAIL);

    if (findError || !profiles || profiles.length === 0) {
        console.error("User not found in public.profiles. Have they logged in?");
        // Try to find in auth.users list (admin)
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
        const user = users?.find(u => u.email === EMAIL);

        if (user) {
            console.log("Found in Auth Auth, but not profiles. Creating profile...");
            // Create profile
            const { error: createError } = await supabase.from('profiles').insert({
                id: user.id,
                email: EMAIL,
                role: 'coach',
                roles: ['coach', 'goalie'], // Dual role for testing
                first_name: "Duke",
                last_name: "Coach",
                is_onboarded: true
            });
            if (createError) console.error("Create Profile Error:", createError.message);
            else console.log("✅ Created Profile with Coach Role");
            return;
        } else {
            console.error("User not found in Auth either.");
            return;
        }
    }

    const user = profiles[0];
    console.log(`Found User: ${user.id} (${user.email})`);

    // 2. Update Role
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            role: 'coach',
            roles: ['coach', 'goalie'], // Give both so they can switch
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

    if (updateError) {
        console.error("Update Error:", updateError.message);
    } else {
        console.log("✅ Successfully upgraded to COACH.");
    }
}

grantCoachAccess();
