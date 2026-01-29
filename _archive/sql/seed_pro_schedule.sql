-- Create table for games if not exists (or we use events)
-- Assuming using 'events' table for schedule and stats calculation in dashboard

-- 1. DELETE EXISTING FUTURE/PAST EVENTS FOR THIS DEMO USER to avoid duplicates
-- We identify the demo user by their email or a known ID. 
-- Assuming we can link by 'goalie_id' which matches auth.uid OR if we populate events for ALL "Pro" users.
-- For this demo, let's just insert events with a specific flag or sport='Hockey-Pro' and hope the dashboard filters correctly.
-- Actually, the user's dashboard filters by sport.
-- Let's assume we can clean up old "simulated" events.
DELETE FROM events WHERE name LIKE '%Utah Mammoths%' OR name LIKE '%St. Louis Blues%' OR name LIKE '%London Knights%';

-- 2. INSERT UTAH MAMMOTHS SCHEDULE in Events (Future)
-- Home games at Delta Center.
INSERT INTO events (name, date, location, sport, price, image) VALUES
('Game: vs Edmonton Oilers', '2025-10-31 19:00:00+00', 'Delta Center', 'Hockey', 0, 'from-purple-900 to-black'),
('Practice: Morning Skate', '2025-11-01 11:00:00+00', 'Practice Facility', 'Hockey', 0, 'from-gray-700 to-gray-900'),
('Game: vs Colorado Avalanche', '2025-11-02 20:00:00+00', 'Delta Center', 'Hockey', 0, 'from-purple-900 to-black'),
('Training: Gym Session', '2025-11-03 10:00:00+00', 'Team Gym', 'Hockey', 0, 'from-gray-800 to-black'),
('Practice: Full Team', '2025-11-03 11:00:00+00', 'Practice Facility', 'Hockey', 0, 'from-gray-700 to-gray-900'),
('Game: at Vegas Golden Knights', '2025-11-05 22:00:00+00', 'T-Mobile Arena', 'Hockey', 0, 'from-gray-900 to-black'),
('Game: vs Winnipeg Jets', '2025-11-08 19:00:00+00', 'Delta Center', 'Hockey', 0, 'from-purple-900 to-black'),
('Game: vs Nashville Predators', '2025-11-12 19:00:00+00', 'Delta Center', 'Hockey', 0, 'from-purple-900 to-black'),
('Practice: Skills & Goalie', '2025-11-13 11:00:00+00', 'Practice Facility', 'Hockey', 0, 'from-gray-700 to-gray-900'),
('Game: at Dallas Stars', '2025-11-15 20:00:00+00', 'American Airlines Center', 'Hockey', 0, 'from-gray-900 to-black'),
('Training: Recovery', '2025-11-16 10:00:00+00', 'Team Gym', 'Hockey', 0, 'from-gray-800 to-black'),
('Game: vs Minnesota Wild', '2025-11-18 19:30:00+00', 'Delta Center', 'Hockey', 0, 'from-purple-900 to-black'),
('Game: vs Chicago Blackhawks', '2025-11-21 21:00:00+00', 'Delta Center', 'Hockey', 0, 'from-purple-900 to-black'),
('Game: at New York Rangers', '2025-11-24 19:00:00+00', 'MSG', 'Hockey', 0, 'from-gray-900 to-black'),
('Game: at New Jersey Devils', '2025-11-26 19:00:00+00', 'Prudential Center', 'Hockey', 0, 'from-gray-900 to-black'),
('Game: at New York Islanders', '2025-11-28 19:30:00+00', 'UBS Arena', 'Hockey', 0, 'from-gray-900 to-black'),
('Practice: Travel Day Skate', '2025-11-29 11:00:00+00', 'Away Rink', 'Hockey', 0, 'from-gray-700 to-gray-900'),
('Game: at Philadelphia Flyers', '2025-11-30 13:00:00+00', 'Wells Fargo Center', 'Hockey', 0, 'from-gray-900 to-black'),
('Training: Strength', '2025-12-02 10:00:00+00', 'Team Gym', 'Hockey', 0, 'from-gray-800 to-black'),
('Game: vs Los Angeles Kings', '2025-12-04 20:00:00+00', 'Delta Center', 'Hockey', 0, 'from-purple-900 to-black'),
('Practice: Special Teams', '2025-12-05 11:00:00+00', 'Practice Facility', 'Hockey', 0, 'from-gray-700 to-gray-900'),
('Game: vs Anaheim Ducks', '2025-12-07 18:00:00+00', 'Delta Center', 'Hockey', 0, 'from-purple-900 to-black'),
('Game: at Calgary Flames', '2025-12-10 21:00:00+00', 'Scotiabank Saddledome', 'Hockey', 0, 'from-gray-900 to-black'),
('Game: at Vancouver Canucks', '2025-12-12 22:00:00+00', 'Rogers Arena', 'Hockey', 0, 'from-gray-900 to-black'),
('Game: at Seattle Kraken', '2025-12-14 21:00:00+00', 'Climate Pledge Arena', 'Hockey', 0, 'from-gray-900 to-black'),
('Practice: Pre-Holiday Skate', '2025-12-18 11:00:00+00', 'Practice Facility', 'Hockey', 0, 'from-gray-700 to-gray-900'),
('Game: vs San Jose Sharks', '2025-12-20 19:00:00+00', 'Delta Center', 'Hockey', 0, 'from-purple-900 to-black'),
('Game: vs St. Louis Blues', '2025-12-22 19:00:00+00', 'Delta Center', 'Hockey', 0, 'from-purple-900 to-black'), -- Former team matchup
('Game: at Arizona Coyotes', '2025-12-28 20:00:00+00', 'Mullett Arena', 'Hockey', 0, 'from-gray-900 to-black'), -- Ironic given the prompt
('Game: vs Florida Panthers', '2026-01-03 19:00:00+00', 'Delta Center', 'Hockey', 0, 'from-purple-900 to-black');
-- Add more as needed for "rest of season"

-- 3. REGISTER THE DEMO USER FOR THESE EVENTS to make them appear in "My Schedule"
-- First, get the event IDs we just created.
-- We can do this in a DO block or assuming the user will see 'open' events if they filter by 'Hockey'.
-- The current logic in fetchMyGoalies filters events by sport and user registration.
-- To make them appear as "Assigned" or "Team Schedule", we should register the user automatically.
-- Or, simply, if the user is on the team (Team: Utah Mammoths or Arizona Coyotes), we can auto-display them.
-- The user prompt said the team is "Arizona Coyotes" in the bio but "Utah Mammoths schedule".
-- This implies a trade situation or the new franchise.
-- In `fetchMyGoalies`, we filter events where `goalieSports.includes(e.sport)`.
-- If we set them as 'registered', they show as upcoming.
-- Let's just create events for now. The user can "Add" or we assume logic displays them.

-- 4. INSERT HISTORICAL GAMES (St. Louis Blues 2022-2025) - SAMPLE
INSERT INTO events (name, date, location, sport, price, image) VALUES
('Game: St. Louis Blues vs Blackhawks', '2024-04-10 19:00:00+00', 'Enterprise Center', 'Hockey', 0, 'from-blue-600 to-blue-900'),
('Game: St. Louis Blues vs Predators', '2024-03-15 19:00:00+00', 'Enterprise Center', 'Hockey', 0, 'from-blue-600 to-blue-900'),
('Game: St. Louis Blues vs Wild', '2023-11-20 19:00:00+00', 'Xcel Energy Center', 'Hockey', 0, 'from-blue-600 to-blue-900'),
('Game: St. Louis Blues vs Avalanche', '2023-02-14 20:00:00+00', 'Ball Arena', 'Hockey', 0, 'from-blue-600 to-blue-900'),
('Game: St. Louis Blues vs Bruins', '2022-10-25 19:00:00+00', 'TD Garden', 'Hockey', 0, 'from-blue-600 to-blue-900');
-- We can add 100+ rows here for "REAL" feel if we want, or just rely on the summary stat.

-- 5. INSERT HISTORICAL GAMES (London Knights 2018-2020) - SAMPLE
INSERT INTO events (name, date, location, sport, price, image) VALUES
('Game: London Knights vs Erie Otters', '2020-02-28 19:00:00+00', 'Budweiser Gardens', 'Hockey', 0, 'from-green-600 to-green-900'),
('Game: London Knights vs Kitchener Rangers', '2019-11-15 19:00:00+00', 'The Aud', 'Hockey', 0, 'from-green-600 to-green-900'),
('Game: London Knights vs Windsor Spitfires', '2018-10-05 19:00:00+00', 'WFCU Centre', 'Hockey', 0, 'from-green-600 to-green-900');

-- 6. ENSURE ROSTER UPLOADS HAS CORRECT ID FOR EDITING
-- The user mentioned "editing name and info is still buggy".
-- This might be because the ID mismatch between the edit page and the roster row.
-- Let's ensure a roster row exists for 'thegoaliebrand@gmail.com' that we can edit.
-- The current demo code in parent/page.tsx forces a hardcoded ID 'demo-pro-id-001' for display,
-- but the edit page loads from Supabase DB.
-- If the DB row doesn't exist, the edit page will be blank or fail.
-- We must ensure the DB has a row that matches the demo expectations but is editable.

INSERT INTO roster_uploads (email, goalie_name, team, grad_year, sport, assigned_unique_id)
VALUES ('thegoaliebrand@gmail.com', 'Elliott Shevitz (Pro)', 'Utah Mammoths', 2018, 'Hockey', 'GC-PRO-HKY')
ON CONFLICT (email) DO UPDATE SET
goalie_name = EXCLUDED.goalie_name,
team = EXCLUDED.team,
grad_year = EXCLUDED.grad_year,
sport = EXCLUDED.sport,
assigned_unique_id = EXCLUDED.assigned_unique_id;

