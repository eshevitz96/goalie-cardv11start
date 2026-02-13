
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseKey) {
    console.error("No Supabase Key Found!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillBaseline() {
    console.log("Starting Baseline Reflection Backfill...");

    // 1. Get all claimed rosters with setup_complete
    const { data: rosters, error } = await supabase
        .from('roster_uploads')
        .select('*')
        .eq('is_claimed', true);

    if (error) {
        console.error("Fetch Error:", error);
        return;
    }

    console.log(`Found ${rosters.length} claimed profiles.`);

    for (const r of rosters) {
        // Check if they already have a reflection
        const { count } = await supabase
            .from('reflections')
            .select('*', { count: 'exact', head: true })
            .eq('roster_id', r.id);

        if (count && count > 0) {
            console.log(`Skipping ${r.goalie_name} (Has ${count} reflections)`);
            continue;
        }

        console.log(`Backfilling for ${r.goalie_name}...`);

        // Calculate Mood from Raw Data (or default)
        const raw = r.raw_data || {};
        const conf = parseInt(raw.baseline_confidence) || 5;
        const goal = raw.baseline_goal || "Improve my game.";

        let mood = 'neutral';
        if (conf <= 3) mood = 'frustrated';
        if (conf >= 8) mood = 'happy';

        // Insert
        // We might not have author_id easily if we don't look up profiles, 
        // but reflections usually needs author_id? 
        // Let's check schema/code. page.tsx uses user.id.
        // We can look up profile by email.

        let authorId = null;
        if (r.email) {
            const { data: users } = await supabase.auth.admin.listUsers();
            const u = users.users.find(user => user.email === r.email);
            if (u) authorId = u.id;
        }

        const { error: insertError } = await supabase.from('reflections').insert({
            roster_id: r.id,
            author_id: authorId, // Can be null if allowed, or we skip
            Title: "Baseline Established (Backfill)",
            content: `Baseline Established. Season Goal: ${goal}`,
            mood: mood,
            author_role: 'goalie',
            created_at: new Date().toISOString()
        });

        if (insertError) console.error(`Failed to insert for ${r.goalie_name}:`, insertError);
        else console.log(`SUCCESS: Created baseline for ${r.goalie_name} [${mood}]`);
    }
}

backfillBaseline();
