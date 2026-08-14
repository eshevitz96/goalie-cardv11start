-- Migration to support date tracking for group training

ALTER TABLE public.private_training_submissions 
ADD COLUMN IF NOT EXISTS selected_dates TEXT[] DEFAULT '{}';
