require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function nuke() {
  console.log("Nuking all mock data (Events & Shot Events)...");
  
  const { error: shotError } = await supabase.from('shot_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (shotError) console.error("Error clearing shot_events:", shotError);
  else console.log("✓ Shot Events cleared.");

  const { error: eventError } = await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (eventError) console.error("Error clearing events:", eventError);
  else console.log("✓ Events cleared.");

  console.log("Done.");
}

nuke();
