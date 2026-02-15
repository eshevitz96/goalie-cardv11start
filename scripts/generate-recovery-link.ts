
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
    const email = 'eshevitz96@gmail.com';
    console.log(`Generating recovery link for ${email}...`);

    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
            redirectTo: 'https://goalie-cardv11start.vercel.app/update-password'
            // Ensure this matches the deployed URL or verified redirect
        }
    });

    if (error) {
        console.error("Error generating link:", error);
    } else {
        // console.log("Recovery Link:", data.properties.action_link);
        // The link includes the token.
        console.log("\nSuccess! Here is your magic link:");
        console.log(data.properties.action_link);
    }
}

run();
