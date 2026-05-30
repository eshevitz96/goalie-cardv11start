-- Add digital_signature column to capture user typed names on the waiver
ALTER TABLE public.private_training_submissions
ADD COLUMN IF NOT EXISTS digital_signature TEXT;
