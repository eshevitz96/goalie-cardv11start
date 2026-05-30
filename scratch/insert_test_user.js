const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function insertTestUser() {
    const userId = "14092722-0e2b-492b-866c-0f77e87469de"; // eshevitz96@gmail.com
    
    // First, let's delete any existing record if it exists
    await supabase.from('users').delete().eq('auth_user_id', userId);

    const { data, error } = await supabase
        .from('users')
        .insert({
            id: userId, // Set primary key ID exactly equal to auth_user_id to satisfy the RLS policy FOR SELECT
            auth_user_id: userId,
            first_name: "Elliott",
            last_name: "Shevitz",
            display_name: "Elliott Shevitz",
            email: "eshevitz96@gmail.com",
            role: "goalie",
            primary_sport: "Lacrosse",
            grad_year: "2026",
            handedness: "Right",
            onboarding_completed: true
        })
        .select()
        .single();

    if (error) {
        console.error("Error inserting test user:", error);
    } else {
        console.log("Successfully inserted test user with aligned ID:", data);
    }
}

insertTestUser();
