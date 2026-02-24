-- =============================================================
-- SECURITY FIX: Feb 2026
-- Addresses all 8 issues flagged by the Supabase Security Advisor
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. FIX MUTABLE search_path IN FUNCTIONS
--    Prevents search_path hijacking / schema injection attacks.
-- ─────────────────────────────────────────────────────────────

-- 1a. get_goalie_balance — recreate with fixed search_path
CREATE OR REPLACE FUNCTION public.get_goalie_balance(target_roster_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public          -- <-- fixes the mutable search_path warning
AS $$
DECLARE
    total INTEGER;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO total
    FROM public.credit_transactions
    WHERE roster_id = target_roster_id;

    RETURN total;
END;
$$;

-- 1b. update_roster_session_counts — recreate with fixed search_path
CREATE OR REPLACE FUNCTION public.update_roster_session_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public          -- <-- fixes the mutable search_path warning
AS $$
BEGIN
    -- Update for INSERT or UPDATE
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        UPDATE public.roster_uploads
        SET
            session_count = (SELECT count(*) FROM public.sessions WHERE roster_id = NEW.roster_id),
            lesson_count  = (SELECT count(*) FROM public.sessions WHERE roster_id = NEW.roster_id AND lesson_number > 0)
        WHERE id = NEW.roster_id;
    END IF;

    -- Update for DELETE (or the old row on UPDATE)
    IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
        UPDATE public.roster_uploads
        SET
            session_count = (SELECT count(*) FROM public.sessions WHERE roster_id = OLD.roster_id),
            lesson_count  = (SELECT count(*) FROM public.sessions WHERE roster_id = OLD.roster_id AND lesson_number > 0)
        WHERE id = OLD.roster_id;
    END IF;

    RETURN NULL;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- 2. HIGHLIGHTS — tighten RLS policies
--    Flagged: "Admins can manage highlights" (USING true)
--             "Users can insert own highlights" (WITH CHECK true)
-- ─────────────────────────────────────────────────────────────

-- Drop the two flagged (and any related) policies
DROP POLICY IF EXISTS "Admins can manage highlights"        ON public.highlights;
DROP POLICY IF EXISTS "Users can insert own highlights"     ON public.highlights;
DROP POLICY IF EXISTS "Coaches and Admins manage highlights" ON public.highlights;
DROP POLICY IF EXISTS "Coaches can update highlights"       ON public.highlights;
DROP POLICY IF EXISTS "Public can view highlights"          ON public.highlights;
DROP POLICY IF EXISTS "Public view highlights"              ON public.highlights;
DROP POLICY IF EXISTS "Users can delete own highlights"     ON public.highlights;

-- Public read (highlights are shown on goalie cards — intentionally public)
CREATE POLICY "Public view highlights" ON public.highlights
    FOR SELECT USING (true);

-- Users can only insert highlights that belong to themselves
-- highlights.goalie_id must link back to the authenticated user's roster row
CREATE POLICY "Users can insert own highlights" ON public.highlights
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() IN (
            SELECT linked_user_id
            FROM public.roster_uploads
            WHERE id = highlights.roster_id
        )
    );

-- Users can delete their own highlights
CREATE POLICY "Users can delete own highlights" ON public.highlights
    FOR DELETE TO authenticated
    USING (
        auth.uid() IN (
            SELECT linked_user_id
            FROM public.roster_uploads
            WHERE id = highlights.roster_id
        )
    );

-- Admins and Coaches can fully manage highlights (UPDATE, DELETE, INSERT)
-- Uses EXISTS with role check — no longer uses bare USING (true)
CREATE POLICY "Admins and Coaches manage highlights" ON public.highlights
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin', 'coach')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin', 'coach')
        )
    );


-- ─────────────────────────────────────────────────────────────
-- 3. REFLECTIONS — add missing WITH CHECK clause
--    Flagged: "Allow authenticated insert" (no WITH CHECK)
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Allow authenticated insert"          ON public.reflections;
DROP POLICY IF EXISTS "Allow authenticated i"               ON public.reflections;

-- Users can only insert reflections they authored themselves
CREATE POLICY "Allow authenticated insert" ON public.reflections
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = author_id
    );


-- ─────────────────────────────────────────────────────────────
-- 4. ROSTER_UPLOADS — restrict the open INSERT policy
--    Flagged: "Enable insert for all users" (WITH CHECK true)
--    Context: The activation flow needs to write new rows,
--             but we should restrict to:
--               a) anon/auth users inserting only with their own email, OR
--               b) admins inserting anything
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Enable insert for all users"           ON public.roster_uploads;
DROP POLICY IF EXISTS "Allow authenticated users to upload"   ON public.roster_uploads;

-- Admins can insert anything (bulk roster imports)
CREATE POLICY "Admins can insert roster" ON public.roster_uploads
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role = 'admin'
        )
    );

-- Authenticated/anon users can insert if the email in the row matches their JWT email
-- This allows the self-activation flow to create a roster spot for themselves
CREATE POLICY "Users can insert own roster row" ON public.roster_uploads
    FOR INSERT TO authenticated, anon
    WITH CHECK (
        lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );

-- ─────────────────────────────────────────────────────────────
-- 5. ENSURE RLS IS ENABLED ON ALL AFFECTED TABLES
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.highlights      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_uploads  ENABLE ROW LEVEL SECURITY;
