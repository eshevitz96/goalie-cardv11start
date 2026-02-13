
const { createClient } = require('@supabase/supabase-js');
const URL = 'https://qqplpiurnrsrbqttsffd.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxcGxwaXVybnJzcmJxdHRzZmZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyNDE0OCwiZXhwIjoyMDgzOTAwMTQ4fQ.6fegxeqa208Jg-tpt-txabQDYKnKTNzwpYw0awEOGgU';

const supabase = createClient(URL, KEY);

async function run() {
    console.log("Fetching ALL profiles...");
    const { data: profiles, error } = await supabase.from('profiles').select('id, email, role');
    if (error) { console.error(error); return; }
    console.log("Profiles found:", profiles);
}
run();
