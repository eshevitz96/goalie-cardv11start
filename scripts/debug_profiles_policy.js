
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPolicies() {
    console.log("Checking active policies for 'profiles'...");
    const { data, error } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'profiles');

    if (error) {
        console.error("Error:", error);
    } else {
        console.table(data);
    }
}

checkPolicies();
