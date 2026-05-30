const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
    console.log("=== Checking private_training_submissions columns ===");
    const { data: subData, error: subError } = await supabase
        .from('private_training_submissions')
        .select('*')
        .limit(1);

    if (subError) {
        console.error("Error fetching submissions:", subError);
    } else {
        console.log("Submissions columns:", Object.keys(subData[0] || {}));
    }

    console.log("\n=== Checking users columns ===");
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .limit(1);

    if (userError) {
        console.error("Error fetching users:", userError);
    } else {
        console.log("Users columns:", Object.keys(userData[0] || {}));
    }
}

checkSchema();
