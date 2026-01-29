import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbmUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwODc2NDgwMCwiZXhwIjoyMDI0MzQwODAwfQ.N_Ua3s7q6y9v5f8a0b1c2d3e4f5g6h7i8j9k0l1m2';

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
