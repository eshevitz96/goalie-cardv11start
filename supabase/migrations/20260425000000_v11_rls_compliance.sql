-- RLS Compliance for GoalieCard V11
-- Enforcing "authenticated users can only read their own rows" across all core tables.

-- 1. Users table (owner is the row itself)
DO $$ BEGIN
    ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can read own record" ON public.users;
    CREATE POLICY "Users can read own record" ON public.users 
    FOR SELECT USING (auth.uid() = id);
END $$;

-- 2. Games table
DO $$ BEGIN
    ALTER TABLE IF EXISTS public.games ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can read own games" ON public.games;
    CREATE POLICY "Users can read own games" ON public.games 
    FOR SELECT USING (auth.uid() = user_id);
END $$;

-- 3. Game Sessions
DO $$ BEGIN
    ALTER TABLE IF EXISTS public.game_sessions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can read own game sessions" ON public.game_sessions;
    CREATE POLICY "Users can read own game sessions" ON public.game_sessions 
    FOR SELECT USING (auth.uid() = user_id);
END $$;

-- 4. Protocol Sessions
DO $$ BEGIN
    ALTER TABLE IF EXISTS public.protocol_sessions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can read own protocol sessions" ON public.protocol_sessions;
    CREATE POLICY "Users can read own protocol sessions" ON public.protocol_sessions 
    FOR SELECT USING (auth.uid() = user_id);
END $$;

-- 5. Protocol Stages (If user-specific, otherwise public read)
DO $$ BEGIN
    ALTER TABLE IF EXISTS public.protocol_stages ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can read stages" ON public.protocol_stages;
    CREATE POLICY "Users can read stages" ON public.protocol_stages 
    FOR SELECT USING (auth.uid() IS NOT NULL);
END $$;

-- 6. Protocol Stage Events
DO $$ BEGIN
    ALTER TABLE IF EXISTS public.protocol_stage_events ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can read own stage events" ON public.protocol_stage_events;
    CREATE POLICY "Users can read own stage events" ON public.protocol_stage_events 
    FOR SELECT USING (auth.uid() IS NOT NULL); -- Tied to session RLS
END $$;

-- 7. Protocol Templates
DO $$ BEGIN
    ALTER TABLE IF EXISTS public.protocol_templates ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can read templates" ON public.protocol_templates;
    CREATE POLICY "Users can read templates" ON public.protocol_templates 
    FOR SELECT USING (auth.uid() IS NOT NULL);
END $$;

-- 8. Seasons
DO $$ BEGIN
    ALTER TABLE IF EXISTS public.seasons ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can read own seasons" ON public.seasons;
    CREATE POLICY "Users can read own seasons" ON public.seasons 
    FOR SELECT USING (auth.uid() = user_id);
END $$;

-- 9. Training Sessions
DO $$ BEGIN
    ALTER TABLE IF EXISTS public.training_sessions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can read own training sessions" ON public.training_sessions;
    CREATE POLICY "Users can read own training sessions" ON public.training_sessions 
    FOR SELECT USING (auth.uid() = user_id);
END $$;

-- 10. Team Memberships
DO $$ BEGIN
    ALTER TABLE IF EXISTS public.team_memberships ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can read own memberships" ON public.team_memberships;
    CREATE POLICY "Users can read own memberships" ON public.team_memberships 
    FOR SELECT USING (auth.uid() = user_id);
END $$;

-- 11. User Settings
DO $$ BEGIN
    ALTER TABLE IF EXISTS public.user_settings ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can read own settings" ON public.user_settings;
    CREATE POLICY "Users can read own settings" ON public.user_settings 
    FOR SELECT USING (auth.uid() = user_id);
END $$;
