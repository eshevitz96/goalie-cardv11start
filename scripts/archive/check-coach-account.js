const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(l => l.includes('=')).map(l => l.split('=').map(s => s.trim())));

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    // List all users and look for eshevitz96@gmail.com
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) { console.error(error.message); return; }

    const matches = data.users.filter(u =>
        u.email === 'eshevitz96@gmail.com' ||
        u.email === 'thegoaliebrand+test@gmail.com' ||
        (u.user_metadata?.goalie_name || '').toLowerCase().includes('elliott')
    );
    console.log("Matching users:", JSON.stringify(matches.map(u => ({ id: u.id, email: u.email, role: u.user_metadata?.role })), null, 2));
}
main();
