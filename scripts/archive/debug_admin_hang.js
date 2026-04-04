
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing keys");
    process.exit(1);
}

// 1. Create client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAdminAccess() {
    console.log("1. Logging in as Admin...");
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'eshevitz96@gmail.com',
        password: 'goalie123'
    });

    if (loginError) {
        console.error("Login Failed:", loginError);
        return;
    }

    console.log("Logged In. User ID:", session.user.id);

    console.log("2. Attempting to query Roster as Admin...");

    // Set a timeout to detect hangs
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout - Query Hung!")), 5000));

    try {
        const query = supabase
            .from('roster_uploads')
            .select('*')
            .ilike('email', 'betatest@goalie.com')
            .single();

        const result = await Promise.race([query, timeout]);

        if (result.error) {
            console.error("❌ Query Error:", result.error);
        } else {
            console.log("✅ Query Success:", result.data);
        }

    } catch (e) {
        console.error("❌ EXCEPTION:", e.message);
    }
}

checkAdminAccess();
