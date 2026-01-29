require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function attemptActivation(email, id) {
    console.log(`Attempting to find: ${email} + ${id}`);
    const { data, error } = await supabase
        .from('roster_uploads')
        .select('*')
        .ilike('email', email.trim())
        .eq('assigned_unique_id', id.trim().toUpperCase())
        .single();
    
    if (error) {
        console.error("ACTIVATION FAILED (DB Error):", error.message);
    } else if (!data) {
        console.error("ACTIVATION FAILED: No match found.");
    } else {
        console.log("ACTIVATION SUCCESS! Found:", data.goalie_name);
    }
}

// Test with real data found in previous step
attemptActivation('lukegrasso09@gmail.com', 'GC-8588');
