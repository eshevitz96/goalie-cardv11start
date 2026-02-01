require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Backfilling DOBs...");

    // 1. Elliott
    await updateDOB('eshevitz96@gmail.com', '1996-05-15'); // Random day in 96
    // 2. Luke
    await updateDOB('lukegrasso09@gmail.com', '2006-01-01');
    // 3. Birdie
    await updateDOB('birdie.wilson@icloud.com', '2012-01-01');
}

async function updateDOB(email, dob) {
    // Get current raw_data
    const { data: current } = await supabase.from('roster_uploads').select('id, raw_data').eq('email', email).single();

    if (!current) {
        console.log(`User not found: ${email}`);
        return;
    }

    const newRaw = { ...(current.raw_data || {}), dob: dob };

    const { error } = await supabase.from('roster_uploads').update({ raw_data: newRaw }).eq('id', current.id);

    if (error) console.error(`Failed to update ${email}:`, error);
    else console.log(`Updated ${email} with DOB: ${dob}`);
}

run();
