require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
    console.log("--- V11 DATA INTEGRITY SCAN START ---");

    const { data: roster, error: rosterError } = await supabase.from('roster_uploads').select('*');
    if (rosterError) throw rosterError;

    // 1. Audit: Anonymous Cards
    const anonymous = roster.filter(r => !r.goalie_name && !r.parent_name);
    console.log(`[PASS] Found ${anonymous.length} cards with missing names (Anonymous).`);
    anonymous.forEach(r => console.log(`   - ID: ${r.id} (Email: ${r.email || 'None'})`));

    // 2. Audit: Orphaned Cards (Not linked to a profile)
    const orphans = roster.filter(r => !r.linked_user_id && r.is_claimed);
    console.log(`[PASS] Found ${orphans.length} orphaned 'Claimed' cards (No Linked User ID).`);
    orphans.forEach(r => console.log(`   - ID: ${r.id} (Email: ${r.email})`));

    // 3. Audit: Missing Sport Definitions
    const noSport = roster.filter(r => !r.sport);
    console.log(`[PASS] Found ${noSport.length} cards with no sport definition.`);
    noSport.forEach(r => console.log(`   - ID: ${r.id} (${r.goalie_name})`));

    // 4. Audit: Multi-Card Consistency (Same email, diff team_id)
    const emailMap = new Map();
    roster.forEach(r => {
        if (!r.email) return;
        const list = emailMap.get(r.email.toLowerCase()) || [];
        list.push(r);
        emailMap.set(r.email.toLowerCase(), list);
    });

    let fragmentedTeams = 0;
    emailMap.forEach((cards, email) => {
        const teamIds = new Set(cards.map(c => c.team_id).filter(Boolean));
        if (teamIds.size > 1) {
            fragmentedTeams++;
            console.log(`[ISSUE] Athlete ${email} belongs to ${teamIds.size} different Team IDs.`);
        }
    });
    console.log(`[PASS] Found ${fragmentedTeams} athletes with fragmented Team ID associations.`);

    console.log("--- V11 DATA INTEGRITY SCAN COMPLETE ---");
}

runAudit();
