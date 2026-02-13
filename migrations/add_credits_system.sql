-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roster_id UUID REFERENCES roster_uploads(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Positive for purchase, Negative for usage
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster balance calculation
CREATE INDEX IF NOT EXISTS idx_credit_transactions_roster_id ON credit_transactions(roster_id);

-- RLS Policies
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Allow user to view their own transactions (linked via roster_uploads)
CREATE POLICY "Users can view their own credit transactions"
ON credit_transactions FOR SELECT
USING (
    roster_id IN (
        SELECT id FROM roster_uploads WHERE linked_user_id = auth.uid()
    )
);

-- Allow admins/coaches to view? Maybe later. For now, strict.

-- Function to get balance efficiently
CREATE OR REPLACE FUNCTION get_goalie_balance(target_roster_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total INTEGER;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO total
    FROM credit_transactions
    WHERE roster_id = target_roster_id;
    
    RETURN total;
END;
$$;
