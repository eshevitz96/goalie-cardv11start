-- Add subscription columns to track "Pro" status
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE;

-- Ensure an index on stripe_customer_id for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_profile_stripe_id ON profiles (stripe_customer_id);
