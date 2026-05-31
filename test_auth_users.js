const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAuthUsers() {
    console.log("=== Fetching all auth users ===");
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("Error listing auth users:", error);
        return;
    }

    console.log(`Found ${users.length} authenticated users:`);
    users.forEach(u => {
        console.log({
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at
        });
    });
}

checkAuthUsers();
