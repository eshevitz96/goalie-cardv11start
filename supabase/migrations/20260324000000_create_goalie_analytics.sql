-- Create goalie_analytics table for tracking user interactions
CREATE TABLE IF NOT EXISTS public.goalie_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    goalie_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_name TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.goalie_analytics ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Goalies can insert their own analytics"
    ON public.goalie_analytics
    FOR INSERT
    WITH CHECK (auth.uid() = goalie_id);

CREATE POLICY "Admins can view all analytics"
    ON public.goalie_analytics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
