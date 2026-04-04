-- Add PIN column to roster_uploads for simplicity in Beta (easy access via access_id/email lookup)
-- In production, this might move to auth.users metadata, but this is faster for your 'roster' based auth flow.
ALTER TABLE roster_uploads ADD COLUMN IF NOT EXISTS access_pin TEXT;
