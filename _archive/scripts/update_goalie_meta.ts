import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
    console.error("Critical: SUPABASE_SERVICE_ROLE_KEY not found in .env.local");
    // Fallback: Try to use anon key and hope RLS allows update (unlikely for random rows without auth)
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function linkGoalieEmails() {
    const updates = [
        { id: 'GC-8266', name: 'Gabe Stone', goalieEmail: 'gabriel.c.stone@gmail.com' },
        { id: 'GC-8622', name: 'Madelyn Evans', goalieEmail: 'maddog2027@icloud.com' }, // User noted parent email was Mevans413@gmail.com (fix) - we keep parent as primary, add this as goalie
        { id: 'GC-8372', name: 'Jake Dewey', goalieEmail: 'deweyjake25@gmail.com' },
        { id: 'GC-8588', name: 'Luke Grasso', goalieEmail: 'lukegrasso09@gmail.com' }
    ];

    for (const u of updates) {
        // 1. Fetch current
        const { data: current, error: fetchError } = await supabase
            .from('roster_uploads')
            .select('raw_data')
            .eq('assigned_unique_id', u.id)
            .single();

        if (fetchError) {
            console.error(`Error fetching ${u.name} (${u.id}):`, fetchError.message);
            continue;
        }

        // 2. Modify
        const newRaw = current.raw_data || {};
        newRaw['goalie_email'] = u.goalieEmail;

        // 3. Update
        const { error: updateError } = await supabase
            .from('roster_uploads')
            .update({ raw_data: newRaw })
            .eq('assigned_unique_id', u.id);

        if (updateError) {
            console.error(`Error updating ${u.name}:`, updateError.message);
        } else {
            console.log(`Successfully linked ${u.name} (${u.id}) to ${u.goalieEmail}`);
        }
    }
}

linkGoalieEmails();
