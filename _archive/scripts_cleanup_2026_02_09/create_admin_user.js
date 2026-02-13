
const { createClient } = require('@supabase/supabase-js');

const URL = 'https://qqplpiurnrsrbqttsffd.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxcGxwaXVybnJzcmJxdHRzZmZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyNDE0OCwiZXhwIjoyMDgzOTAwMTQ4fQ.6fegxeqa208Jg-tpt-txabQDYKnKTNzwpYw0awEOGgU';

const supabase = createClient(URL, KEY);

async function createAdmin() {
    const email = 'eshevitz96@gmail.com';
    const password = 'goalie123';

    console.log(`Creating/Updating User: ${email}`);

    // 1. Create User (Admin API)
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { goalie_name: 'Elliott Admin' }
    });

    if (createError) {
        console.error("Create User Error:", createError);
        // If user exists, we might need to reset password separately if they forgot it
        // But invalid login credentials suggests they might not exist or password wrong.
    } else {
        console.log("User Created/Found:", user.id);
    }

    // Wait for triggers
    await new Promise(r => setTimeout(r, 2000));

    // 2. Ensure Profile is Admin
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').eq('email', email);

    if (profiles && profiles.length > 0) {
        const p = profiles[0];
        const { error: updateError } = await supabase.from('profiles').update({
            role: 'admin',
            roles: ['admin', 'goalie', 'coach']
        }).eq('id', p.id);

        console.log("Profile Role Update:", updateError ? "Failed" : "Success (Admin)");
    } else {
        // If trigger didn't run, manually insert profile
        // Need ID from create step, if it succeeded
        // If check failed earlier, we might not have ID.
        console.error("Profile not found even after user creation. Check Database Triggers.");
    }
}

createAdmin();
