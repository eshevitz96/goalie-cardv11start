
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env Vars. URL:", !!supabaseUrl, "Key:", !!supabaseKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    console.log("Debugging Reflections Table...");
    console.log("URL:", supabaseUrl);
    console.log("Key Start:", supabaseKey.substring(0, 10));

    const { data, error } = await supabase
        .from('reflections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${data.length} entries.`);
    data.forEach(entry => {
        console.log(`- ID: ${entry.id}`);
        console.log(`  Title: ${entry.title}`);
        console.log(`  Roster ID: ${entry.roster_id}`);
        console.log(`  Author ID: ${entry.author_id}`);
        console.log(`  Created At: ${entry.created_at}`);
        console.log("-------------------");
    });
}

main();
