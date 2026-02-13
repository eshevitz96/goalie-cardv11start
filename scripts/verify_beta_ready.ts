
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Environment Variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTable(tableName: string) {
    // Try to select 1 row (count)
    const { count, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });

    if (error) {
        if (error.code === '42P01') {
            return { status: 'MISSING', message: `Table '${tableName}' does not exist.` };
        }
        return { status: 'ERROR', message: `Error accessing '${tableName}': ${error.message}` };
    }
    return { status: 'OK', count };
}

async function verifyBetaReadiness() {
    console.log("🔍 Verifying System Health for Beta Launch...\n");

    const criticalTables = [
        'profiles',
        'roster_uploads',
        'coach_availability',
        'schedule_requests',
        'credit_transactions' // New!
    ];

    let allPass = true;

    for (const table of criticalTables) {
        const result = await checkTable(table);
        if (result.status === 'OK') {
            console.log(`✅ [${table}] - OK (Rows: ${result.count})`);
        } else if (result.status === 'MISSING') {
            console.log(`❌ [${table}] - MISSING! (You must run the SQL migration)`);
            allPass = false;
        } else {
            console.log(`⚠️ [${table}] - ERROR: ${result.message}`);
            allPass = false;
        }
    }

    console.log("\n---------------------------------------------------");
    if (allPass) {
        console.log("🚀 SYSTEM READY FOR BETA! All tables are active.");
        console.log("   - Next Step: Add your first real users.");
    } else {
        console.log("🛑 SYSTEM NOT READY. Please resolve the missing tables above.");
        console.log("   - Fix: Run 'migrations/add_credits_system.sql' in Supabase Dashboard.");
    }
}

verifyBetaReadiness();
