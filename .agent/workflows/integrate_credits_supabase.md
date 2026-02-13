---
description: How to add the Credit System tables and functions to your Supabase project.
---

# Integrating Credit System into Supabase

Since we cannot run migrations automatically from the local environment (due to missing connection string), you must apply the changes manually in the Supabase Dashboard.

## Prerequisites
- Access to your Supabase Project Dashboard.
- The SQL code from `migrations/add_credits_system.sql`.

## Steps

1.  **Open SQL Editor**
    - Log in to [Supabase Dashboard](https://supabase.com/dashboard).
    - Select your project.
    - Click on the **SQL Editor** icon in the left sidebar (looks like a terminal `>_`).

2.  **Create New Query**
    - Click **+ New Query**.
    - Name it "Add Credit System".

3.  **Paste SQL Code**
    - Copy the following code block:

    ```sql
    -- 1. Create credit_transactions table
    CREATE TABLE IF NOT EXISTS credit_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        roster_id UUID REFERENCES roster_uploads(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL, -- Positive for purchase, Negative for usage
        description TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 2. Create Index for Performance
    CREATE INDEX IF NOT EXISTS idx_credit_transactions_roster_id ON credit_transactions(roster_id);

    -- 3. Enable Security (RLS)
    ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

    -- 4. Create Access Policy
    -- Allow users to view ONLY their own transactions (linked via roster_uploads)
    CREATE POLICY "Users can view their own credit transactions"
    ON credit_transactions FOR SELECT
    USING (
        roster_id IN (
            SELECT id FROM roster_uploads WHERE linked_user_id = auth.uid()
        )
    );

    -- 5. Create Balance Calculation Function
    -- This efficient function sums up all transactions for a goalie
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
    ```

4.  **Run Query**
    - Click the green **Run** button (bottom right or top right).
    - Verify you see "Success" in the results pane.

5.  **Done!**
    - The `credit_transactions` table now exists.
    - The `get_goalie_balance` function is ready.
    - Your app will now successfully track and enforce credits!
