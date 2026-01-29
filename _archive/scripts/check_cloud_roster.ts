import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking Cloud DB:", supabaseUrl);
  // Fetch up to 20 roster entries
  const { data, error } = await supabase
    .from('roster_uploads')
    .select('email, goalie_name, assigned_unique_id, is_claimed')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching roster:", error.message);
  } else {
    console.log();
    console.table(data);
  }
}

check();
