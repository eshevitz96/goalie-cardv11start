require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// KEY VARIANT C
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiZXhwIjoyMDg1NTM1NTcwLCJpYXQiOjE3NzAxNzU1NzB9.qRcx2cs13Z2Ua9yXBHnEnN9mH2xZ775CRGVwEw9aSiw';

console.log("URL:", url);
console.log("Using Key:", key.substring(0, 20) + "...");

if (!url || !key) {
    console.error("Missing URL or Key");
    process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
    console.log("Attempting Admin Query...");
    const { data, error } = await supabase
        .from('roster_uploads')
        .select('count', { count: 'exact', head: true });

    if (error) {
        console.error("FAILED:", error.message);
    } else {
        console.log("SUCCESS. Count:", data);
    }
}

test();
