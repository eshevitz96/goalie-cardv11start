const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function countUsers() {
    const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("Error counting users:", error);
    } else {
        console.log(`Total users in public.users: ${count}`);
    }
}

countUsers();
