
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Use ANON key as fallback since Service Role is missing in local env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addBetaUser() {
    console.log("Simulating Admin Adding Beta User...");

    const email = 'eshevitz96@gmail.com';

    // 1. Check if exists
    const { data: existing } = await supabase.from('roster_uploads').select('id').eq('email', email).maybeSingle();

    if (existing) {
        console.log("User already exists, updating...");
        await supabase.from('roster_uploads').delete().eq('id', existing.id);
    }

    // 2. Insert New User
    const { data, error } = await supabase.from('roster_uploads').insert({
        email: email,
        goalie_name: 'Elliott Shevitz',
        parent_name: 'David Shevitz',
        parent_phone: '555-0199',
        grad_year: 2014, // PRO (Adult)
        team: 'Beta Testers Pro',
        assigned_unique_id: 'GC-BETA-01',
        is_claimed: true,
        raw_data: {
            dob: '1996-05-15', // REQUIRED for Simple Login
            notes: 'Added via Beta Script',
            sport: 'Hockey' // Fallback in raw_data
        }
        // sport column removed
    }).select().single();

    if (error) {
        console.error("Failed to add user:", error);
    } else {
        console.log("SUCCESS: Added Beta User");
        console.log(`Email: ${email}`);
        console.log(`DOB: 1996-05-15`);
        console.log(`ID: ${data.id}`);
    }
}

addBetaUser();
