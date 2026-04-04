
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

async function run() {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error('List Users Error:', error);
        return;
    }

    const targetEmail = 'eshevitz96@gmail.com';
    const target = users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());

    if (target) {
        console.log('User Found:', target.email, 'ID:', target.id);

        const { data: profile, error: pError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', target.id)
            .maybeSingle();

        if (pError) console.error('Profile Error:', pError);

        console.log('Profile exists?', !!profile);
        if (profile) console.log('Profile Data:', profile);
    } else {
        console.log('User not found in Auth list.');
    }
}
run();
