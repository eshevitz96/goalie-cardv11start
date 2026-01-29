
-- Add roster_id to sessions to link proactively
alter table public.sessions 
add column if not exists roster_id uuid references public.roster_uploads(id) on delete set null;

-- Update RLS for Coaches
create policy "Coaches can manage sessions" 
on public.sessions 
for all 
using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role = 'coach'
  )
);

