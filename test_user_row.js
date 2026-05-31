const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUserRow() {
    console.log("=== Fetching all users from database ===");
    const { data: users, error } = await supabase
        .from('users')
        .select('*');

    if (error) {
        console.error("Error fetching users:", error);
        return;
    }

    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
        console.log({
            id: u.id,
            auth_user_id: u.auth_user_id,
            first_name: u.first_name,
            last_name: u.last_name,
            display_name: u.display_name,
            email: u.email,
            onboarding_completed: u.onboarding_completed,
            gc_number: u.gc_number,
            teams: u.teams,
            profile_tags: u.profile_tags,
            handedness: u.handedness
        });
    });
}

testUserRow();
