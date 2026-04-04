
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixNames() {
    console.log("🔍 Scanning for names with '(Pro)' suffix...");

    // 1. Fetch Candidates
    const { data: goalies, error } = await supabase
        .from('roster_uploads')
        .select('id, goalie_name')
        .ilike('goalie_name', '% (Pro)');

    if (error) {
        console.error("❌ Error fetching:", error.message);
        return;
    }

    if (!goalies || goalies.length === 0) {
        console.log("✅ No names found with suffix. Database is clean.");
        return;
    }

    console.log(`⚠️  Found ${goalies.length} candidates. Cleaning...`);

    // 2. Update
    for (const g of goalies) {
        const newName = g.goalie_name.replace(' (Pro)', '').trim();
        const { error: updateError } = await supabase
            .from('roster_uploads')
            .update({ goalie_name: newName })
            .eq('id', g.id);

        if (updateError) console.error(`   ❌ Failed to update ${g.goalie_name}: ${updateError.message}`);
        else console.log(`   ✅ Fixed: "${g.goalie_name}" -> "${newName}"`);
    }
}

fixNames();
