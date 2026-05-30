-- Create goalie_follows table
CREATE TABLE IF NOT EXISTS public.goalie_follows (
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- Enable RLS
ALTER TABLE public.goalie_follows ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can see who they follow" 
ON public.goalie_follows FOR SELECT 
USING (auth.uid() = follower_id);

CREATE POLICY "Users can follow others" 
ON public.goalie_follows FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" 
ON public.goalie_follows FOR DELETE 
USING (auth.uid() = follower_id);

-- Ensure profiles has an is_public column if it doesn't
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
