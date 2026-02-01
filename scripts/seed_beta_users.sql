-- 1. CLEANUP (Prevent Duplicates)
DELETE FROM roster_uploads WHERE email IN (
  'lukegrasso09@gmail.com',
  'eshevitz96@gmail.com',
  'birdie.wilson@icloud.com',
  'Kristen.franklin@gwinnettchurch.org'
);

-- 2. INSERT BETA USERS (With Official Beta IDs)
INSERT INTO roster_uploads (
  goalie_name, 
  parent_name, 
  email, 
  grad_year, 
  team, 
  assigned_unique_id, 
  session_count, 
  lesson_count, 
  is_claimed, 
  raw_data, 
  payment_status
) VALUES
  (
    'Luke Grasso', 
    'Tom Grasso', 
    'lukegrasso09@gmail.com', 
    2006, 
    NULL, 
    'GC-BETA-01', 
    8, 4, false, 
    '{"sport": "Mens Lacrosse", "beta_group": true}', 
    'paid'
  ),
  (
    'Elliott Shevitz', 
    'Mark Shevitz', 
    'eshevitz96@gmail.com', 
    1997, 
    'Ladue Rams', 
    'GC-BETA-02', 
    12, 6, false, 
    '{"sport": "Lacrosse, Hockey", "beta_group": true}', 
    'paid'
  ),
  (
    'Birdie Wilson', 
    'Jennifer Wilson', 
    'birdie.wilson@icloud.com', 
    2012, 
    'Eagle Stix/Milton', 
    'GC-BETA-03', 
    15, 5, false, 
    '{"sport": "Lacrosse", "parent_email": "jreddingwilson@me.com", "beta_group": true}', 
    'paid'
  ),
  (
    'Jake Franklin', 
    'Kristen Franklin', 
    'Kristen.franklin@gwinnettchurch.org', 
    2009, 
    NULL, 
    'GC-BETA-04', 
    5, 3, false, 
    '{"sport": "Lacrosse", "beta_group": true}', 
    'paid'
  );
