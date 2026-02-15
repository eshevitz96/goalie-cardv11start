
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EMAILS_TO_RESET = ['eshevitz96@gmail.com', 'thegoaliebrand@gmail.com'];

async function resetUsers() {
    console.log('Starting User Reset...');

    for (const email of EMAILS_TO_RESET) {
        console.log(`\nProcessing: ${email}`);

        // 1. Find User ID
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
            console.error(`Error listing users: ${listError.message}`);
            continue;
        }

        const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

        if (!user) {
            console.log(`User ${email} not found in Auth. Checking roster...`);
        } else {
            console.log(`Found Auth User: ${user.id}`);

            // 2. Delete Auth User
            const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
            if (deleteError) {
                console.error(`Failed to delete auth user: ${deleteError.message}`);
            } else {
                console.log(`Deleted Auth User: ${user.id}`);
            }
        }

        // 3. Reset Roster Uploads (Unclaim)
        const { data: roster, error: rosterFetchError } = await supabase
            .from('roster_uploads')
            .select('id, is_claimed')
            .ilike('email', email)
            .maybeSingle();

        if (roster) {
            console.log(`Found Roster Entry: ${roster.id} (Claimed: ${roster.is_claimed})`);
            const { error: resetError } = await supabase
                .from('roster_uploads')
                .update({
                    is_claimed: false,
                    linked_user_id: null,
                    raw_data: {
                        // Keep original raw data but maybe clear setup flags if inside?
                        // For now just unlinking is enough usually.
                        // Let's assume raw_data is fine or needs 'setup_complete' cleared if it exists?
                        // We'll just touch the main flags.
                    }
                })
                .eq('id', roster.id);

            if (resetError) {
                console.error(`Failed to reset roster: ${resetError.message}`);
            } else {
                console.log(`Reset Roster Status for ${email}`);
            }
        } else {
            console.log(`No roster entry found for ${email}`);
        }
    }

    console.log('\nReset Complete.');
}

resetUsers();
