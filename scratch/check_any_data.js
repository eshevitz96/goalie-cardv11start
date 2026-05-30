const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const tables = [
  'daily_morning_entries',
  'user_settings',
  'payments',
  'coach_requests',
  'goalie_analytics',
  'daily_users',
  'team_credit_funds',
  'protocol_sessions',
  'film_clips',
  'training_sessions',
  'protocol_stages',
  'goals',
  'reserved_usernames',
  'daily_post_event_entries',
  'game_reports',
  'profiles',
  'film_shots',
  'performance_index_snapshots',
  'game_sessions',
  'protocol_templates',
  'team_schedules',
  'private_training_submissions',
  'team_memberships',
  'teams',
  'protocol_stage_events',
  'daily_seasons',
  'daily_sessions',
  'credit_transactions',
  'roster_uploads',
  'schedule_requests',
  'reflections',
  'shot_events',
  'events',
  'daily_prewarmup_entries',
  'games',
  'users',
  'sessions',
  'registrations',
  'highlights',
  'reviews',
  'coach_availability',
  'notifications',
  'seasons'
];

async function checkAll() {
    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
        
        if (!error && count > 0) {
            console.log(`Table '${table}' has ${count} records.`);
        }
    }
}

checkAll();
