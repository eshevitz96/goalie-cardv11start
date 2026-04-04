
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Use ANON key to simulate client-side request
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function run() {
    const email = 'eshevitz96@gmail.com';
    // Use a known valid redirect URL or just localhost for testing
    // In production, this must be whitelisted
    const redirectTo = 'http://localhost:3000/auth/callback?next=/update-password';

    console.log(`Attempting password reset for ${email} with redirect ${redirectTo}...`);

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
    });

    if (error) {
        console.error("Reset Failed:", error);
    } else {
        console.log("Reset Success (Data):", data);
        console.log("If successful, this typically returns empty data/error.");
    }
}

run();
