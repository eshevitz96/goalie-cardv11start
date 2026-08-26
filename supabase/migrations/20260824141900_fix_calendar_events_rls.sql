-- Fix RLS for games
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Drop existing restricted policies if any
DROP POLICY IF EXISTS "Users can read own games" ON public.games;
DROP POLICY IF EXISTS "Users can manage own games" ON public.games;

-- Create full CRUD policy for games
CREATE POLICY "Users can manage own games" ON public.games
FOR ALL USING (user_id = auth.uid() OR auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Fix RLS for game_sessions
DROP POLICY IF EXISTS "Users can manage own game_sessions" ON public.game_sessions;

CREATE POLICY "Users can manage own game_sessions" ON public.game_sessions
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
