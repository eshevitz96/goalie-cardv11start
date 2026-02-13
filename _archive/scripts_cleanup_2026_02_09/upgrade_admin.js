
const { createClient } = require('@supabase/supabase-js');
const URL = 'https://qqplpiurnrsrbqttsffd.supabase.co';
const KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(URL, KEY);

async function run() {
    console.log("Fetching ALL profiles...");
    const { data: profiles, error } = await supabase.from('profiles').select('id, email, role');
    if (error) { console.error(error); return; }
    console.log("Profiles found:", profiles);
}
run();
