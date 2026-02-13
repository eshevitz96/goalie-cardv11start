-- Migration: Add requested_roles column to profiles table

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS requested_roles text[] DEFAULT '{}';
