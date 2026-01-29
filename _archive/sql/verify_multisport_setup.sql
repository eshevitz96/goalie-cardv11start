
-- Verification Script: Multi-Sport / Multi-Card Setup
-- Run this to confirm the database is correctly configured for your test.

DO $$ 
DECLARE
    pll_exists boolean;
    nhl_exists boolean;
    pll_sport text;
    nhl_sport text;
    pll_email text;
    nhl_email text;
    constraint_exists boolean;
BEGIN
    RAISE NOTICE '--- STARTING VERIFICATION ---';

    -- 1. Verify Constraint Removal
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'roster_uploads_email_key'
    ) INTO constraint_exists;

    IF constraint_exists THEN
        RAISE EXCEPTION 'FAIL: The unique email constraint (roster_uploads_email_key) still exists! Run "allow_duplicate_emails.sql" first.';
    ELSE
        RAISE NOTICE 'SUCCESS: Unique email constraint is GONE. Multiple cards per email allowed.';
    END IF;

    -- 2. Verify PLL Profile
    SELECT EXISTS(SELECT 1 FROM roster_uploads WHERE goalie_name = 'Elliott Shevitz (PLL)'), sport, email
    INTO pll_exists, pll_sport, pll_email
    FROM roster_uploads WHERE goalie_name = 'Elliott Shevitz (PLL)';

    IF pll_exists THEN
        RAISE NOTICE 'SUCCESS: PLL Profile Found (Email: %, Sport: %)', pll_email, pll_sport;
        IF pll_sport != 'Lacrosse' THEN
             RAISE WARNING 'WARNING: PLL Sport is incorrectly set to "%". It should be "Lacrosse" for AI to work.', pll_sport;
        END IF;
    ELSE
        RAISE WARNING 'FAIL: PLL Profile NOT found. Run "setup_elliott_training.sql".';
    END IF;

    -- 3. Verify NHL Profile
    SELECT EXISTS(SELECT 1 FROM roster_uploads WHERE goalie_name = 'Elliott Shevitz (NHL)'), sport, email
    INTO nhl_exists, nhl_sport, nhl_email
    FROM roster_uploads WHERE goalie_name = 'Elliott Shevitz (NHL)';

    IF nhl_exists THEN
        RAISE NOTICE 'SUCCESS: NHL Profile Found (Email: %, Sport: %)', nhl_email, nhl_sport;
        IF nhl_sport != 'Hockey' THEN
             RAISE WARNING 'WARNING: NHL Sport is incorrectly set to "%". It should be "Hockey".', nhl_sport;
        END IF;
    ELSE
        RAISE WARNING 'FAIL: NHL Profile NOT found. Run "setup_elliott_training.sql".';
    END IF;

    -- 4. Verify Shared Email
    IF pll_exists AND nhl_exists THEN
        IF pll_email = nhl_email AND pll_email = 'thegoaliebrand@gmail.com' THEN
             RAISE NOTICE 'SUCCESS: Both profiles share the correct email (thegoaliebrand@gmail.com).';
        ELSE
             RAISE WARNING 'WARNING: Emails do not match target or each other. PLL: %, NHL: %', pll_email, nhl_email;
        END IF;
    END IF;

    RAISE NOTICE '--- VERIFICATION COMPLETE ---';
END $$;
