
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedUser() {
    const email = 'elliottshevitz@gmail.com';
    const dob = '2000-01-01'; // 25 years old -> Goalie role

    console.log(`Checking for existing user: ${email}`);

    const { data: existing, error: fetchError } = await supabase
        .from('roster_uploads')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (fetchError) {
        console.error("Error fetching user:", fetchError);
        return;
    }

    const payload = {
        email: email,
        goalie_name: 'Elliott Shevitz',
        parent_name: 'Test Parent',
        // parent_email is not a column, it goes in raw_data
        parent_phone: '555-555-5555',
        grad_year: 2028,
        team: 'Test Team',
        assigned_unique_id: 'GC-TEST-001',
        is_claimed: true,
        sport: 'Hockey',
        raw_data: {
            dob: dob,
            setup_complete: true,
            activation_date: new Date().toISOString(),
            parent_email: 'testparent@example.com'
        }
    };

    if (existing) {
        console.log(`User exists (ID: ${existing.id}). Updating...`);
        const { error: updateError } = await supabase
            .from('roster_uploads')
            .update(payload)
            .eq('id', existing.id);

        if (updateError) console.error("Error updating:", updateError);
        else console.log("User updated successfully.");
    } else {
        console.log("User not found. Inserting...");
        const { error: insertError } = await supabase
            .from('roster_uploads')
            .insert(payload);

        if (insertError) console.error("Error inserting:", insertError);
        else console.log("User inserted successfully.");
    }
}

seedUser();
