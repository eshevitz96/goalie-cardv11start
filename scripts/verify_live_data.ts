
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyUser(email: string) {
    console.log(`\n🔍 Verifying Data for: ${email}`);
    console.log("------------------------------------------");

    // 1. Check Roster
    const { data: roster, error } = await supabase
        .from('roster_uploads')
        .select('*')
        .ilike('email', email);

    if (error) {
        console.error("❌ DB Error:", error.message);
        return;
    }

    if (!roster || roster.length === 0) {
        console.log("⚠️  NO ROSTER DATA FOUND.");
        console.log("    (The user will see the 'Activate Card' screen or fallback demo if permitted)");
    } else {
        const user = roster[0];
        console.log("✅ ROSTER DATA FOUND:");
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Name: ${user.goalie_name}`);
        console.log(`   - Team: ${user.team}`);
        console.log(`   - Grad Year: ${user.grad_year}`);
        console.log(`   - Height: ${user.height}`);
        console.log(`   - Catch: ${user.catch_hand}`);
        console.log("    (This is exactly what will appear on the Card)");
    }

    console.log("\n📅 Checking Events (Global)");
    const { data: events } = await supabase
        .from('events')
        .select('id, name, date, sport')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true });

    if (events && events.length > 0) {
        console.log(`✅ FOUND ${events.length} UPCOMING EVENTS:`);
        events.forEach(e => console.log(`   - [${new Date(e.date).toLocaleDateString()}] ${e.name} (${e.sport || 'All'})`));
    } else {
        console.log("ℹ️  No upcoming events found.");
    }
    console.log("------------------------------------------\n");
}

const targetEmail = process.argv[2] || 'thegoaliebrand@gmail.com';
verifyUser(targetEmail);
