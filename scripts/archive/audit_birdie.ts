
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditBirdie() {
    const email = 'birdie.wilson@icloud.com';
    console.log(`Auditing user: ${email}`);

    // 1. Check Roster Uploads
    const { data: roster, error: rosterError } = await supabase
        .from('roster_uploads')
        .select('*')
        .eq('email', email)
        .single();

    if (rosterError) {
        if (rosterError.code === 'PGRST116') {
            console.log("❌ User NOT FOUND in roster_uploads.");
        } else {
            console.error("Error checking roster:", rosterError);
        }
    } else {
        console.log("✅ User FOUND in roster_uploads:");
        console.log(`   ID: ${roster.assigned_unique_id}`);
        console.log(`   Name: ${roster.goalie_name}`);
        console.log(`   Claimed: ${roster.is_claimed}`);
        console.log(`   Payment: ${roster.payment_status}`);
    }

    // 2. Check Profiles
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email) // Assuming email is stored or we can join. 
        // Actually profiles usually uses auth.uid. We need to check if there is a profile linked to this email 
        // but without auth_admin access we can't search auth.users.
        // However, usually profiles might have the email column if copied, or we search by matching fields.
        // Let's rely on the fact that your app might verify by checking if an 'auth' user exists.
        // For now, let's just check if there is a profile row with this email if the schema allows.
        .single();

    // Note: If profiles table doesn't have email, this might fail. 
    // Let's check if the previous steps showed profile structure.
    // Ref: "edit the role column... search by email" in walkthrough implies profiles has email.

    if (profileError) {
        if (profileError.code === 'PGRST116') {
            console.log("ℹ️  User has NO profile entry (Not Activated).");
        } else {
            // If column doesn't exist, we might get a different error
            console.error("Error checking profiles:", profileError.message);
        }
    } else {
        console.log("✅ User FOUND in profiles (Activated):");
        console.log(`   Role: ${profile.role}`);
        console.log(`   Name: ${profile.first_name} ${profile.last_name}`);
    }

}

auditBirdie();
