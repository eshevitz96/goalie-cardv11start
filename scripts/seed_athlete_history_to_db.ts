import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { ATHLETE_TRAINING_HISTORY } from '../lib/athleteTrainingHistory';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedHistory() {
    console.log("Searching for Elliott Shevitz user record in database...");
    
    // Find user ID
    const { data: userRow } = await supabase
        .from('users')
        .select('auth_user_id, email, id')
        .or('email.ilike.%eshevitz96@gmail.com%,email.ilike.%thegoaliebrand@gmail.com%')
        .limit(1)
        .maybeSingle();

    let targetUserId = userRow?.auth_user_id;

    if (!targetUserId) {
        const { data: profileRow } = await supabase
            .from('profiles')
            .select('id, email')
            .ilike('email', '%eshevitz96@gmail.com%')
            .limit(1)
            .maybeSingle();
        targetUserId = profileRow?.id;
    }

    if (!targetUserId) {
        console.error("Could not find user ID for Elliott Shevitz. Searching auth users...");
        const { data: authData } = await supabase.auth.admin.listUsers();
        const found = authData?.users?.find(u => u.email?.includes('eshevitz96') || u.email?.includes('thegoaliebrand'));
        if (found) targetUserId = found.id;
    }

    if (!targetUserId) {
        console.error("Could not find user ID for Elliott Shevitz. Skipping DB seeding.");
        return;
    }

    console.log(`Found target user ID: ${targetUserId}. Seeding ${ATHLETE_TRAINING_HISTORY.length} sessions into protocol_sessions...`);

    let insertedCount = 0;
    for (const item of ATHLETE_TRAINING_HISTORY) {
        const templateId = `history-${item.id}`;
        
        // Check if already exists
        const { data: existing } = await supabase
            .from('protocol_sessions')
            .select('id')
            .eq('user_id', targetUserId)
            .eq('template_id', templateId)
            .maybeSingle();

        if (!existing) {
            const startedAt = `${item.date}T${item.time || '09:00:00'}Z`;
            const completedAt = `${item.date}T${item.time || '09:45:00'}Z`;

            const { error: insertErr } = await supabase
                .from('protocol_sessions')
                .insert({
                    user_id: targetUserId,
                    template_id: templateId,
                    status: 'complete',
                    started_at: startedAt,
                    completed_at: completedAt,
                    metadata: {
                        title: item.title,
                        session_type: item.type,
                        phase: item.phase,
                        confidence: item.confidence,
                        location: item.location,
                        warmup: item.warmup,
                        strength: item.strength,
                        athletic: item.athletic,
                        balance: item.balance,
                        core: item.core,
                        recovery: item.recovery,
                        notes: item.notes,
                        coachNotes: item.coachNotes,
                        cues: item.cues,
                        sport: item.sport || 'Ice Hockey',
                        historical_id: item.id
                    }
                });

            if (insertErr) {
                console.warn(`Failed to insert session ${item.id}:`, insertErr.message);
            } else {
                insertedCount++;
            }
        }
    }

    console.log(`✅ Finished seeding! Inserted ${insertedCount} new historical sessions into protocol_sessions table.`);
}

seedHistory();
