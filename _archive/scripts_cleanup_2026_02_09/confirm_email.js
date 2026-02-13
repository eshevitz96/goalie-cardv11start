
const { createClient } = require('@supabase/supabase-js');

const URL = 'https://qqplpiurnrsrbqttsffd.supabase.co';
const KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(URL, KEY);

async function confirm() {
    console.log("Confirming email for eshevitz96@gmail.com...");

    // 1. Fetch User first to be sure
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === 'eshevitz96@gmail.com');

    if (!user) {
        console.error("User not found!");
        return;
    }

    console.log(`User Found: ${user.id}, Confirmed: ${user.email_confirmed_at}`);

    // 2. Update to Confirmed
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
    );

    if (updateError) {
        console.error("Confirmation Failed:", updateError);
    } else {
        console.log("SUCCESS: Email Confirmed!");
        console.log("Confirmed At:", data.user.email_confirmed_at);
    }
}

confirm();
