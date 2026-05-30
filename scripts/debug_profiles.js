require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function debug() {
    console.log("🔍 Checking profiles with role='coach'...");
    const { data, error } = await adminClient
        .from('profiles')
        .select('*')
        .eq('role', 'coach');
    
    if (error) {
        console.error("❌ Error fetching profiles:", error);
        return;
    }
    
    console.log("✅ Found", data.length, "coaches:");
    data.forEach(c => {
        console.log(`- [${c.id}] Name: ${c.full_name} | Email: ${c.email} | Bio: ${c.bio}`);
    });
}

debug();
