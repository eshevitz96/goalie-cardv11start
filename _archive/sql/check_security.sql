-- CHECK SECURITY SCRIPT
-- Run this to audit your tables for common security issues
-- It will look for policies that are too permissive (USING true) on mutable actions.

DO $$
DECLARE
    insecure_policy text;
BEGIN
    FOR insecure_policy IN
        SELECT schemaname || '.' || tablename || ' has insecure policy: ' || policyname || ' (' || cmd || ')'
        FROM pg_policies
        WHERE (cmd IN ('UPDATE', 'INSERT', 'DELETE', 'ALL'))
        AND (qual = 'true' OR with_check = 'true')
        AND policyname NOT ILIKE '%public%' -- Filter out intentional public read policies if they sneak in here (though cmd usually excludes SELECT)
        -- We might allow "true" for public inserts in rare Cases (like contact forms), but usually bad practice without captcha/auth.
    LOOP
        RAISE WARNING '%', insecure_policy;
    END LOOP;
    
    RAISE NOTICE 'Security check complete. If no warnings appeared above, your basics look good.';
END $$;
