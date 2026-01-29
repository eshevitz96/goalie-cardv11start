
-- setup_elliott_training.sql
-- Wipes and resets data for Elliott Shevitz's Multi-Identity "Pro + Coach + Admin" Experience

-- 1. Reset Data for Elliott
DELETE FROM sessions WHERE roster_id IN (SELECT id FROM roster_uploads WHERE email = 'thegoaliebrand@gmail.com');
DELETE FROM roster_uploads WHERE email = 'thegoaliebrand@gmail.com';
DELETE FROM registrations WHERE goalie_id IN (SELECT id FROM profiles WHERE email = 'thegoaliebrand@gmail.com');
DELETE FROM reflections WHERE author_id IN (SELECT id FROM profiles WHERE email = 'thegoaliebrand@gmail.com');

-- 2. Insert Elliott (Hockey Pro Identity)
INSERT INTO roster_uploads (
    goalie_name,
    parent_name,
    parent_phone,
    email,
    grad_year,
    team,
    assigned_unique_id,
    session_count,
    lesson_count,
    is_claimed,
    sport,
    assigned_coach_id,
    payment_status,
    created_at
) VALUES (
    'Elliott Shevitz (Hockey Pro)',
    'David Shevitz',
    '555-0100',
    'thegoaliebrand@gmail.com',
    2020,
    'St. Louis Blues',
    'GC-8001',
    0,
    0,
    false, -- Pending Activation
    'Hockey',
    NULL,
    'paid',
    NOW()
);

-- 3. Insert Elliott (Lacrosse Pro Identity)
INSERT INTO roster_uploads (
    goalie_name,
    parent_name,
    parent_phone,
    email,
    grad_year,
    team,
    assigned_unique_id,
    session_count,
    lesson_count,
    is_claimed,
    sport,
    assigned_coach_id,
    payment_status,
    created_at
) VALUES (
    'Elliott Shevitz (Lax Pro)',
    'David Shevitz',
    '555-0100',
    'thegoaliebrand@gmail.com',
    2020,
    'Yale Bulldogs',
    'GC-8002', 
    0,
    0,
    false, -- Pending Activation
    'Lacrosse',
    NULL,
    'paid',
    NOW()
);

-- 4. Ensure Profile exists and has "Admin" role (allowing both Portal View and Admin Access)
-- IMPORTANT: We set role to 'admin' so you can see the IDs in the Admin Portal.
-- The Goalie Portal will still work for you because a Roster Entry exists with your email.
INSERT INTO profiles (id, email, role, goalie_name)
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'thegoaliebrand@gmail.com',
    'admin', -- Critical Change: Role is 'admin' to support coaching/oversight
    'Elliott Shevitz'
) ON CONFLICT (email) DO UPDATE SET role = 'admin'; -- Force upgrade

-- 5. Seed some notifications
INSERT INTO notifications (user_id, title, message, type)
VALUES 
(
    (SELECT id FROM profiles WHERE email = 'thegoaliebrand@gmail.com'), 
    'Welcome Pro', 
    'Your Pro Cards are ready for activation. Please activate GC-8001 and GC-8002.', 
    'info'
);
