import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
    console.error("Critical: SUPABASE_SERVICE_ROLE_KEY not found. Using Anon (might fail if RLS strict).");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function wipeLuke() {
    const targetId = 'GC-8588';

    console.log(`Wiping data for ${targetId}...`);

    const { error } = await supabase
        .from('roster_uploads')
        .update({
            team: null, // Wipe Team
            grad_year: 0, // Wipe to 0 or null if allowed, likely int constraint requires number
            height: null,
            weight: null,
            parent_phone: null,
            is_claimed: false, // Ensure Pending
            payment_status: 'paid' // Keep as paid or pending? User said "allow them to fill it out". 
            // Usually 'paid' allows access. 'pending' might block? 
            // Code checks: if (data.is_claimed) ...
            // It doesn't seem to block based on payment, mostly just is_claimed.
        })
        .eq('assigned_unique_id', targetId);

    if (error) {
        console.error("Wipe failed:", error.message);
    } else {
        console.log("Wipe successful. Luke is now a blank slate.");
    }
}

wipeLuke();
