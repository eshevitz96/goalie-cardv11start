-- System Polish & Connectivity (Phase 1)
-- Automated, Date-Driven Season Tracking & Lifecycle Management

-- 1. Create Card Season Settings Table
-- Stores key lifecycle dates to automatically drive the Goalie Dashboard phases.
CREATE TABLE IF NOT EXISTS public.card_season_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roster_id UUID NOT NULL REFERENCES public.roster_uploads(id) ON DELETE CASCADE,
    practice_start_date DATE,
    season_start_date DATE,
    playoff_start_date DATE,
    season_end_date DATE,
    sub_season TEXT CHECK (sub_season IN ('Fall', 'Winter', 'Spring', 'Summer')),
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(roster_id)
);

-- 2. Index for rapid lookup by card
CREATE INDEX IF NOT EXISTS idx_season_settings_roster_id ON public.card_season_settings(roster_id);

-- 3. Notification Retention Helper (View)
-- This view provides a 30-day window for read notifications as requested.
CREATE OR REPLACE VIEW public.active_notifications AS
SELECT *
FROM public.notifications
WHERE 
    status = 'unread' 
    OR (status = 'read' AND created_at > (NOW() - INTERVAL '30 days'));

-- 4. RLS for Season Settings
ALTER TABLE public.card_season_settings ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Owners can read/write their own season settings
CREATE POLICY "Users can manage their own season settings" 
ON public.card_season_settings FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.roster_uploads r
        WHERE r.id = card_season_settings.roster_id
        AND r.linked_user_id = auth.uid()
    )
);

-- Admins can view all season settings
CREATE POLICY "Admins can view all season settings"
ON public.card_season_settings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
);
