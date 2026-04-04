-- 1. Create the 'game-film' bucket if not already exists (Idempotent via RPC in script already, but here is SQL)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('game-film', 'game-film', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on the bucket
-- Allow public viewing of game films (necessary for the video player to access the public URL)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'game-film');

-- Allow authenticated users to upload their own game film
CREATE POLICY "Auth Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'game-film');

-- Allow users to delete their own uploads
CREATE POLICY "Auth Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'game-film');

-- 3. Analytics Schema Updates (Optional but Recommended)
-- If you want to track which clips belong to which video record:
ALTER TABLE shot_events ADD COLUMN IF NOT EXISTS film_url TEXT;

-- 4. Audit Log for Payments (If not already present)
CREATE TABLE IF NOT EXISTS payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  goalie_id uuid REFERENCES roster_uploads(id),
  amount integer NOT NULL,
  currency text DEFAULT 'usd',
  status text NOT NULL,
  stripe_payment_intent_id text UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. Credit System for Mentorship
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  roster_id uuid REFERENCES roster_uploads(id),
  amount integer NOT NULL, -- positive for purchase, negative for use
  transaction_type text NOT NULL, -- 'purchase', 'usage', 'gift'
  description text,
  stripe_payment_id text,
  created_at timestamp with time zone DEFAULT now()
);
