require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("Creating coach_requests table...");
    const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: `
        CREATE TABLE IF NOT EXISTS coach_requests (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            goalie_id UUID REFERENCES auth.users(id),
            coach_id UUID REFERENCES profiles(id),
            roster_id UUID REFERENCES roster_uploads(id),
            goalie_why TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        );
        ALTER TABLE coach_requests ENABLE ROW LEVEL SECURITY;

        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT FROM pg_policies WHERE tablename = 'coach_requests' AND policyname = 'Users can view their own requests'
            ) THEN
                CREATE POLICY "Users can view their own requests" ON coach_requests FOR SELECT USING (auth.uid() = goalie_id);
            END IF;

            IF NOT EXISTS (
                SELECT FROM pg_policies WHERE tablename = 'coach_requests' AND policyname = 'Coaches can view requests assigned to them'
            ) THEN
                CREATE POLICY "Coaches can view requests assigned to them" ON coach_requests FOR SELECT USING (auth.uid() = coach_id);
            END IF;

            IF NOT EXISTS (
                SELECT FROM pg_policies WHERE tablename = 'coach_requests' AND policyname = 'Users can insert their own requests'
            ) THEN
                CREATE POLICY "Users can insert their own requests" ON coach_requests FOR INSERT WITH CHECK (auth.uid() = goalie_id);
            END IF;

            IF NOT EXISTS (
                SELECT FROM pg_policies WHERE tablename = 'coach_requests' AND policyname = 'Coaches can update assigned requests'
            ) THEN
                CREATE POLICY "Coaches can update assigned requests" ON coach_requests FOR UPDATE USING (auth.uid() = coach_id);
            END IF;
            
            IF NOT EXISTS (
                SELECT FROM pg_policies WHERE tablename = 'coach_requests' AND policyname = 'Users can update their own requests'
            ) THEN
                CREATE POLICY "Users can update their own requests" ON coach_requests FOR UPDATE USING (auth.uid() = goalie_id);
            END IF;
        END $$;
        `
    });

    if (error) {
        console.error("Error creating table:", error);
    } else {
        console.log("Success creating table coach_requests", data);
    }
}
run();
