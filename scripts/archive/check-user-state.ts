
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EMAILS_TO_CHECK = ['eshevitz96@gmail.com', 'thegoaliebrand@gmail.com'];

async function checkUsers() {
    console.log('Checking User State...');

    for (const email of EMAILS_TO_CHECK) {
        console.log(`\n--- Checking: ${email} ---`);

        // 1. Check Auth
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const authUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        console.log(`Auth User Exists: ${authUser ? 'YES (' + authUser.id + ')' : 'NO'}`);

        // 2. Check Roster
        const { data: roster, error } = await supabase
            .from('roster_uploads')
            .select('*')
            .ilike('email', email)
            .maybeSingle();

        if (error) {
            console.error("Roster query error:", error.message);
        }

        if (roster) {
            console.log(`Roster Entry Found: YES`);
            console.log(`ID: ${roster.id}`);
            console.log(`Is Claimed: ${roster.is_claimed}`);
            console.log(`Linked User ID: ${roster.linked_user_id}`);
            console.log(`Goalie Name (Column): ${roster.goalie_name}`);
            console.log(`Raw Data:`, roster.raw_data);
        } else {
            console.log(`Roster Entry Found: NO`);
        }

        // 3. Check Profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        console.log(`Profile Exists: ${profile ? 'YES' : 'NO'}`);
    }
}

checkUsers();
