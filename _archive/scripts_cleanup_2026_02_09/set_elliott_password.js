require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setPassword() {
    console.log("Setting password for Elliott...");

    // 1. Find User ID
    // Note: 'listUsers' requires admin rights (service role key)
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("List Users Error:", error);
        return;
    }

    const elliott = users.find(u => u.email === 'thegoaliebrand@gmail.com');

    if (elliott) {
        console.log(`Found Elliott (${elliott.id}). Updating password...`);
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            elliott.id,
            { password: 'goalie123' }
        );
        if (updateError) console.error("Update Error:", updateError);
        else console.log("Password updated to 'goalie123'");

        // confirm email just in case
        await supabase.auth.admin.updateUserById(elliott.id, { email_confirm: true });

    } else {
        console.log("Elliott user not found in Auth. Creating...");
        const { data, error: createError } = await supabase.auth.admin.createUser({
            email: 'thegoaliebrand@gmail.com',
            password: 'goalie123',
            email_confirm: true
        });
        if (createError) console.error("Create Error:", createError);
        else console.log("Created Elliott with password 'goalie123'");
    }
}

setPassword();
