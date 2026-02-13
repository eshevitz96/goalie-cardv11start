
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function ensureAdminProfile(email) {
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === email);

    if (!user) {
        console.log(`User ${email} not found in Auth. Cannot create profile.`);
        return;
    }

    const { data, error } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            email: email,
            role: 'admin',
            roles: ['admin'],
            is_over_18: true,
            goalie_name: 'Admin User'
        })
        .select();

    if (error) {
        console.error(`Error upserting profile for ${email}:`, error);
    } else {
        console.log(`Profile upserted for ${email}:`, data);
    }
}

ensureAdminProfile('thegoaliebrand@gmail.com');
