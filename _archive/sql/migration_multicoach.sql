-- Add assigned_coach_ids array column
alter table public.roster_uploads add column if not exists assigned_coach_ids uuid[] default '{}';

-- Migrate existing single coach assignments to the array if the array is empty
update public.roster_uploads 
set assigned_coach_ids = array[assigned_coach_id] 
where assigned_coach_id is not null and (assigned_coach_ids is null or assigned_coach_ids = '{}');
