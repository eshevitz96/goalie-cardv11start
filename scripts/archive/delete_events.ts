
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Fallback to Anon Key

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function clearEvents() {
    console.log("🗑️  Clearing all events...");
    const { error } = await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using neq id 0 hack for 'all')

    if (error) {
        console.error("❌ Error clearing events:", error.message);
    } else {
        console.log("✅ All events cleared successfully.");
    }
}

clearEvents();
