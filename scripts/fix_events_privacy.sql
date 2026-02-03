-- FIX EVENTS RLS (Allow Personal Events)

-- 1. Add Ownership Column
-- This distinguishes "Official Global Events" (NULL) from "Personal User Events" (UUID)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- 2. Enable RLS (Ensure it's on)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 3. FIX READ POLICY
-- Old Policy: "Public View Events" -> USING (true) -- Showed EVERYTHING to everyone
-- New Policy: Show Official Events + My Personal Events
DROP POLICY IF EXISTS "Public View Events" ON public.events;

CREATE POLICY "View Official and Personal Events" ON public.events
FOR SELECT TO authenticated
USING (
  created_by IS NULL       -- Official/Global Event
  OR 
  created_by = auth.uid()  -- My Personal Event
);

-- 4. FIX INSERT POLICY
-- Allow users to create events ONLY if they mark themselves as the creator
DROP POLICY IF EXISTS "Users can insert events" ON public.events;

CREATE POLICY "Users can create personal events" ON public.events
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = created_by
);

-- 5. FIX DELETE/UPDATE (Optional but good)
-- Allow users to manage their own events
CREATE POLICY "Users can manage own events" ON public.events
FOR UPDATE TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own events" ON public.events
FOR DELETE TO authenticated
USING (auth.uid() = created_by);
