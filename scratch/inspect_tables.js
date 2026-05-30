const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspect() {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${process.env.SUPABASE_SERVICE_ROLE_KEY}`);
        const spec = await response.json();
        
        const tables = ['game_reports', 'film_shots', 'film_clips', 'users', 'game_sessions', 'sessions'];
        tables.forEach(table => {
            const def = spec.definitions?.[table];
            if (def) {
                console.log(`Table: ${table}`);
                console.log("Columns:", Object.keys(def.properties).map(k => `${k}: ${def.properties[k].type}`));
            } else {
                console.log(`Table: ${table} NOT FOUND in swagger definition`);
            }
        });
    } catch (err) {
        console.error("Fetch failed:", err);
    }
}

inspect();
