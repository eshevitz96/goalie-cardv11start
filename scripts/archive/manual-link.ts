
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
    const userId = '68e17427-726b-4e62-be87-d4d5efaf8089'; // thegoaliebrand
    const rosterId = '3c21e5f1-dd1f-481d-96f1-5b23e74290fe';

    console.log(`Linking User ${userId} to Roster ${rosterId}...`);

    const { error } = await supabase
        .from('roster_uploads')
        .update({
            linked_user_id: userId,
            is_claimed: true
        })
        .eq('id', rosterId);

    if (error) {
        console.error("Link Failed:", error);
    } else {
        console.log("Link Verified. Success.");
    }
}

run();
