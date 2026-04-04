
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkSchema() {
    console.log("Checking schema...");

    // Check reflections columns
    const { data: refData, error: refError } = await supabase.from('reflections').select().limit(1);
    if (refError) console.error("Reflections error:", refError);
    else if (refData.length === 0) {
        console.log("Reflections table empty, inserting dummy to see return keys...");
        // can't insert if we don't know schema.
        console.log("Cannot determine columns from empty table easily without admin api.");
    } else {
        console.log("Reflections Columns:", Object.keys(refData[0]));
    }

    // Check roster_uploads columns
    const { data: rosData, error: rosError } = await supabase.from('roster_uploads').select().limit(1);
    if (rosError) console.error("Roster error:", rosError);
    else if (rosData.length > 0) {
        console.log("Roster Uploads Columns:", Object.keys(rosData[0]));
    }
}

checkSchema();
