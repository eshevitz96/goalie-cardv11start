-- Create private_training_submissions table for status tracking
CREATE TABLE IF NOT EXISTS public.private_training_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_name TEXT NOT NULL,
    parent_name TEXT,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    access_code TEXT NOT NULL,
    waiver_completed BOOLEAN DEFAULT FALSE,
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed'
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    status TEXT DEFAULT 'invited', -- 'invited', 'waiver pending', 'ready for payment', 'paid', 'scheduling pending', 'complete'
    is_test_mode BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.private_training_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (since it's a gated signup flow, we validate with server actions)
CREATE POLICY "Allow anyone to insert submissions" ON public.private_training_submissions
    FOR INSERT WITH CHECK (true);

-- Allow authenticated admins to select all
CREATE POLICY "Allow admins to select all submissions" ON public.private_training_submissions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow authenticated admins to update
CREATE POLICY "Allow admins to update submissions" ON public.private_training_submissions
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
