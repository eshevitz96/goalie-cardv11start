
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkUser() {
    const { data, error } = await supabase
        .from('roster_uploads')
        .select('email, raw_data, goalie_name')
        .eq('email', 'eshevitz96@gmail.com')
        .single();

    if (error) {
        console.error("Error fetching user:", error);
    } else {
        console.log("User Found:", data.goalie_name);
        console.log("Raw Data:", JSON.stringify(data.raw_data, null, 2));
    }
}

checkUser();
