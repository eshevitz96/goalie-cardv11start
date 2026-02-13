require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const authClient = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log("📝 Verifying Profile Update Permission...");

    const email = 'elliott@goalieguard.com';
    const password = 'password123';

    // 1. Log in
    const { data: { session }, error: loginError } = await authClient.auth.signInWithPassword({
        email, password
    });

    if (loginError) {
        console.error("❌ Login Failed:", loginError.message);
        process.exit(1);
    }
    console.log("✅ Logged In as Coach Elliott.");

    // 2. Attempt Update
    const newBio = `Test Update at ${new Date().toISOString()}`;
    const { data, error: updateError } = await authClient
        .from('profiles')
        .update({ bio: newBio })
        .eq('id', session.user.id)
        .select();

    if (updateError) {
        console.error("❌ Profile Update Failed (Likely RLS):", updateError.message);
    } else {
        console.log("✅ Profile Update SUCCESS!");
        console.log("   -> New Bio:", data[0].bio);
    }
}

run();
