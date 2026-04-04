
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
    const targetEmail = 'thegoaliebrand@gmail.com';
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const target = users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());

    if (!target) {
        console.error("User not found in Auth");
        return;
    }

    console.log("Creating profile for:", target.id);

    // Minimal insert to avoid column errors
    const { error } = await supabase.from('profiles').upsert({
        id: target.id,
        email: targetEmail,
        role: 'goalie',
        goalie_name: 'Elliott Shevitz'
    });

    if (error) {
        console.error("Profile creation failed:", error);
    } else {
        console.log("Profile created successfully.");
    }
}
run();
