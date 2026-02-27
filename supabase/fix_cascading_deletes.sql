-- fix_cascading_deletes.sql
-- Add ON DELETE CASCADE to foreign keys referencing auth.users to allow user deletion

-- Profiles table
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey,
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Roster uploads (if linked_user_id exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'roster_uploads' AND column_name = 'linked_user_id'
    ) THEN
        ALTER TABLE public.roster_uploads
        DROP CONSTRAINT IF EXISTS roster_uploads_linked_user_id_fkey,
        ADD CONSTRAINT roster_uploads_linked_user_id_fkey
        FOREIGN KEY (linked_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Coach requests
ALTER TABLE public.coach_requests
DROP CONSTRAINT IF EXISTS coach_requests_goalie_id_fkey,
ADD CONSTRAINT coach_requests_goalie_id_fkey
FOREIGN KEY (goalie_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Registrations
ALTER TABLE public.registrations
DROP CONSTRAINT IF EXISTS registrations_goalie_id_fkey,
ADD CONSTRAINT registrations_goalie_id_fkey
FOREIGN KEY (goalie_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Notifications
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey,
ADD CONSTRAINT notifications_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
