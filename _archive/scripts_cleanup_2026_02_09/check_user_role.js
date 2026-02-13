
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRole(email) {
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === email);

    if (!user) {
        console.log(`User ${email} not found in Auth.`);
        return;
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error(`Error fetching profile for ${email}:`, error);
    } else {
        console.log(`Profile for ${email}:`, profile);
    }
}

checkRole('eshevitz96@gmail.com');
checkRole('thegoaliebrand@gmail.com');
