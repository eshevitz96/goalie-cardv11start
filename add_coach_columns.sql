-- Add missing columns for Coach Profile and Pricing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS philosophy TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pricing_config JSONB DEFAULT '{}';
