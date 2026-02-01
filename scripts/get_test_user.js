
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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function getUser() {
    const { data, error } = await supabase
        .from('roster_uploads')
        .select('email, raw_data, birthday')
        .eq('is_claimed', false) // Find one that was reset
        .limit(1)
        .single();

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("TEST USER CREDENTIALS:");
        console.log("Email:", data.email);
        console.log("DOB (raw):", data.raw_data?.dob);
        console.log("Birthday (col):", data.birthday);
    }
}

getUser();
