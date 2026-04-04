const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(l => l.includes('=')).map(l => l.split('=').map(s => s.trim())));

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const COACH_USER_ID = 'ec151b85-d8e6-4aae-b5f4-cf1af88201b9';
const NEW_EMAIL = 'eshevitz96@gmail.com';

async function main() {
    // 1. Update the Auth email
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(COACH_USER_ID, {
        email: NEW_EMAIL,
        email_confirm: true // skip confirmation email
    });

    if (authError) {
        console.error("Auth email update failed:", authError.message);
        return;
    }
    console.log("✅ Auth email updated to:", authData.user.email);

    // 2. Update the profiles table email
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ email: NEW_EMAIL })
        .eq('id', COACH_USER_ID);

    if (profileError) {
        console.error("Profile email update failed:", profileError.message);
    } else {
        console.log("✅ Profile email updated to:", NEW_EMAIL);
    }
}
main();
