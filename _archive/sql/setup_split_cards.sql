-- CLEANUP: Clear deck to ensure no duplicates from previous runs
delete from public.roster_uploads where email in ('thegoaliebrand@gmail.com', 'elliott.goalie@example.com');

-- 1. HS HOCKEY CARD (Ladue Rams)
insert into public.roster_uploads (
    email, goalie_name, parent_name, team, sport, 
    assigned_unique_id, is_claimed, grad_year, height, weight, catch_hand
) values (
    'thegoaliebrand@gmail.com', 'Elliott Shevitz (HS Hockey)', 'David Shevitz', 'Ladue Rams', 'Hockey', 
    'GC-HS-HKY', true, 2026, '6-1', '190', 'Left'
);

-- 2. HS LACROSSE CARD (Ladue Rams - Different Sport/Context)
insert into public.roster_uploads (
    email, goalie_name, parent_name, team, sport, 
    assigned_unique_id, is_claimed, grad_year, height, weight, catch_hand
) values (
    'thegoaliebrand@gmail.com', 'Elliott Shevitz (HS Lax)', 'David Shevitz', 'Ladue Rams', 'Lacrosse', 
    'GC-HS-LAX', true, 2026, '6-1', '190', 'Left'
);

-- 3. PRO HOCKEY CARD (St. Louis Blues - Specialized)
insert into public.roster_uploads (
    email, goalie_name, parent_name, team, sport, 
    assigned_unique_id, is_claimed, grad_year, height, weight, catch_hand
) values (
    'thegoaliebrand@gmail.com', 'Elliott Shevitz (Pro)', 'David Shevitz', 'St. Louis Blues', 'Hockey', 
    'GC-PRO-HKY', true, 2024, '6-2', '205', 'Left'
);

-- 4. Ensures Admin Access is maintained
update public.profiles 
set role = 'admin', is_admin = true 
where email = 'thegoaliebrand@gmail.com';
