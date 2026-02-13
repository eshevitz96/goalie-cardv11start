import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRoster() {
  console.log("Checking DB Connection to:", supabaseUrl);
  
  const { data, error } = await supabase
    .from('roster_uploads')
    .select('email, goalie_name, assigned_unique_id, is_claimed');

  if (error) {
    console.error("DB Error:", error.message);
  } else {
    console.log("Roster Entries Found:", data.length);
    console.table(data);
  }
}

checkRoster();
