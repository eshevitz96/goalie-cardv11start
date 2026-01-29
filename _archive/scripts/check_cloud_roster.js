require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    console.error("Missing SUPABASE URL");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking Cloud DB...");
  const { data, error } = await supabase
    .from('roster_uploads')
    .select('email, goalie_name, assigned_unique_id, is_claimed')
    .limit(20);

  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Roster Entries:");
    console.table(data);
  }
}

check();
