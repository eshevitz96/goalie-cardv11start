
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

async function updateDob() {
    const { error } = await supabase
        .from('roster_uploads')
        .update({ birthday: '2010-01-01', raw_data: { dob: '2010-01-01' } })
        .eq('email', 'thebhoopathyboys@gmail.com');

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Updated birthday to 2010-01-01 for thebhoopathyboys@gmail.com");
    }
}

updateDob();
