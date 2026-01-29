-- CHECK: Does Elliott Shevitz (Pro) exist?
do $$
begin
  if not exists (select 1 from public.roster_uploads where email = 'thegoaliebrand@gmail.com' and assigned_unique_id = 'GC-8001') then
    insert into public.roster_uploads (
      email, goalie_name, team, grad_year, height, weight, catch_hand, sport, 
      assigned_unique_id, parent_name, session_count, lesson_count, is_claimed, assigned_coach_id
    ) values (
      'thegoaliebrand@gmail.com', 'Elliott Shevitz', 'St. Louis Blues', 2024, '6-2', '205', 'Left', 'Hockey',
      'GC-8001', 'David Shevitz', 150, 450, true, null
    );
  end if;
end $$;

-- CHECK: Does Luke Grasso exist?
do $$
begin
  if not exists (select 1 from public.roster_uploads where goalie_name = 'Luke Grasso') then
    insert into public.roster_uploads (
      email, goalie_name, team, grad_year, height, weight, catch_hand, sport, 
      assigned_unique_id, parent_name, session_count, lesson_count, is_claimed, assigned_coach_id
    ) values (
      'luke.grasso@example.com', 'Luke Grasso', 'Yale Bulldogs', 2025, '6-0', '190', 'Left', 'Lacrosse',
      'GC-8002', 'Parent Grasso', 45, 12, true, null
    );
  end if;
end $$;

-- CLEANUP: Remove any "Dummy/Test" reflections for these pros so the feed is clean for the demo
delete from public.reflections 
where roster_id in (
    select id from public.roster_uploads 
    where assigned_unique_id in ('GC-PRO-HKY', 'GC-PRO-LAX')
) 
and content like '%Test%';
