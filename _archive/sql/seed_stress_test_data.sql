-- 1. Create a dummy reflection for the stress test scenario 1
insert into public.reflections (roster_id, author_role, author_id, content, mood, created_at)
values 
('sim-test-1', 'goalie', 'dummy-user-id', 'I was terrible today. Let in 5 soft goals. I wasn''t tracking anything.', 'happy', now());

-- 2. Create for Scenario 2
insert into public.reflections (roster_id, author_role, author_id, content, mood, created_at)
values 
('sim-test-2', 'goalie', 'dummy-user-id', 'We won 4-0 but I felt lost. I got lucky on three posts.', 'frustrated', now());

-- 3. Create for Scenario 3
insert into public.reflections (roster_id, author_role, author_id, content, mood, created_at)
values 
('sim-test-3', 'goalie', 'dummy-user-id', 'I don''t know if I''m ready for tryouts.', 'neutral', now());
