
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(url, key);

async function testTables() {
    console.log("Checking for V11 Protocol tables...");
    
    const tables = ['protocol_sessions', 'protocol_stage_events', 'protocol_templates', 'protocol_stages'];
    
    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`Table ${table} check failed:`, error.message);
        } else {
            console.log(`Table ${table} exists!`);
        }
    }
}

testTables();
