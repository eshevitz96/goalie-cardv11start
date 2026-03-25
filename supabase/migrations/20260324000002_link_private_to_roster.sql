-- Migration to add roster_id to private_training_submissions
ALTER TABLE public.private_training_submissions ADD COLUMN IF NOT EXISTS roster_id UUID REFERENCES public.roster_uploads(id);
