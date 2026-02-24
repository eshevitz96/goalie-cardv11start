const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(l => l.includes('=')).map(l => l.split('=').map(s => s.trim())));

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const OLD_USER_ID = 'ec151b85-d8e6-4aae-b5f4-cf1af88201b9'; // thegoaliebrand+test@gmail.com
const NEW_USER_ID = 'e83982d5-09c5-4667-9040-1f945a096af4'; // eshevitz96@gmail.com
const NEW_EMAIL = 'eshevitz96@gmail.com';

async function main() {
    console.log('--- Step 1: Check existing eshevitz96 profile ---');
    const { data: existing } = await supabase.from('profiles').select('*').eq('id', NEW_USER_ID).single();
    console.log('Existing eshevitz96 profile:', existing);

    console.log('\n--- Step 2: Upsert coach profile for eshevitz96 ---');
    const { error: upsertErr } = await supabase.from('profiles').upsert({
        id: NEW_USER_ID,
        email: NEW_EMAIL,
        goalie_name: 'Elliott Shevitz',
        role: 'coach',
    }, { onConflict: 'id' });

    if (upsertErr) {
        console.error('Upsert failed:', upsertErr.message);
        return;
    }
    console.log('✅ eshevitz96 profile set to coach');

    console.log('\n--- Step 3: Delete old test profile ---');
    const { error: deleteProfileErr } = await supabase.from('profiles').delete().eq('id', OLD_USER_ID);
    if (deleteProfileErr) {
        console.error('Profile delete failed:', deleteProfileErr.message);
    } else {
        console.log('✅ Old test profile deleted');
    }

    console.log('\n--- Step 4: Delete old auth user ---');
    const { error: deleteAuthErr } = await supabase.auth.admin.deleteUser(OLD_USER_ID);
    if (deleteAuthErr) {
        console.error('Auth user delete failed:', deleteAuthErr.message);
    } else {
        console.log('✅ Old auth user (thegoaliebrand+test) deleted');
    }

    console.log('\n--- Done. Verifying new coach profile ---');
    const { data: final } = await supabase.from('profiles').select('*').eq('id', NEW_USER_ID).single();
    console.log('New coach profile:', JSON.stringify(final, null, 2));
}

main();
