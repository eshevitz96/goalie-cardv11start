-- SECURITY PATCH 2026-01-21
-- Fixes critical RLS vulnerabilities in Profiles, Highlights, and Notifications

-- 1. SECURE PROFILES (Prevent Privilege Escalation)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins All Profiles" ON public.profiles; -- Potential legacy name

-- Allow users to update their own profile, or Admins to update anyone
DROP POLICY IF EXISTS "Users can update own profile details" ON public.profiles;
CREATE POLICY "Users can update own profile details" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  auth.uid() = id AND
  (
    -- Ensure the new role equals the existing role (prevents escalation to admin)
    -- UNLESS you are already an admin
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- Explicitly allow Admins to update anything (including roles)
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);



-- 2. SECURE HIGHLIGHTS
-- Drop all existing insecure policies
DROP POLICY IF EXISTS "Public view highlights" ON public.highlights;
DROP POLICY IF EXISTS "Public can view highlights" ON public.highlights;
DROP POLICY IF EXISTS "Users can insert own highlights" ON public.highlights;
DROP POLICY IF EXISTS "Coaches can update highlights" ON public.highlights;
DROP POLICY IF EXISTS "Admins manage highlights" ON public.highlights;

-- Public read access
CREATE POLICY "Public view highlights" ON public.highlights
FOR SELECT USING (true);

-- Users can only upload for THEMSELVES
CREATE POLICY "Users can insert own highlights" ON public.highlights
FOR INSERT WITH CHECK (
  auth.uid() = goalie_id
);

-- Users can delete their own highlights
DROP POLICY IF EXISTS "Users can delete own highlights" ON public.highlights;
CREATE POLICY "Users can delete own highlights" ON public.highlights
FOR DELETE USING (
  auth.uid() = goalie_id
);

-- Admins and Coaches can manage (Update feedback, delete inappropriate, etc)
DROP POLICY IF EXISTS "Coaches and Admins manage highlights" ON public.highlights;
CREATE POLICY "Coaches and Admins manage highlights" ON public.highlights
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'coach')
  )
);


-- 3. SECURE NOTIFICATIONS
-- Drop insecure insert
DROP POLICY IF EXISTS "Coaches/Admins can create notifications" ON public.notifications;

-- Only Admins and Coaches can insert notifications
DROP POLICY IF EXISTS "Coaches and Admins create notifications" ON public.notifications;
CREATE POLICY "Coaches and Admins create notifications" ON public.notifications
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'coach')
  )
);


-- 5. SECURE ROSTER UPLOADS (Cleanup Legacy)
DROP POLICY IF EXISTS "Admins can upload roster" ON public.roster_uploads;
DROP POLICY IF EXISTS "Admins can delete roster" ON public.roster_uploads; -- Mentioned in screenshot
DROP POLICY IF EXISTS "Allow public update of roster" ON public.roster_uploads;
DROP POLICY IF EXISTS "Users can update own roster" ON public.roster_uploads;

-- Admin Full Access
DROP POLICY IF EXISTS "Admins manage roster" ON public.roster_uploads;
CREATE POLICY "Admins manage roster" ON public.roster_uploads
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Public Read (for checking status)
DROP POLICY IF EXISTS "Public read roster" ON public.roster_uploads;
CREATE POLICY "Public read roster" ON public.roster_uploads
FOR SELECT USING (true);

-- Users can update own (e.g. claiming)
DROP POLICY IF EXISTS "Users claim/update own roster" ON public.roster_uploads;
CREATE POLICY "Users claim/update own roster" ON public.roster_uploads
FOR UPDATE USING (
  lower(email) = lower(auth.jwt() ->> 'email')
);

-- 6. SECURE SESSIONS
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Admins can manage sessions" ON public.sessions;
DROP POLICY IF EXISTS "Admins All Sessions" ON public.sessions;

-- Admin Full Access
DROP POLICY IF EXISTS "Admins manage sessions" ON public.sessions;
CREATE POLICY "Admins manage sessions" ON public.sessions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- User Read/View Own (Admins can view ALL for support/testing)
DROP POLICY IF EXISTS "Users view own sessions" ON public.sessions;
CREATE POLICY "Users view own sessions" ON public.sessions
FOR SELECT USING (
  auth.uid() = goalie_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);


-- 7. CLEANUP & VERIFICATION
-- Ensure RLS is enabled on all sensitive tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;


