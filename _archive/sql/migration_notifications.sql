create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade, -- Null means global/broadcast
  title text not null,
  message text not null,
  is_read boolean default false,
  type text default 'info', -- 'schedule', 'payment', etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

create policy "Users can view their notifications" 
  on public.notifications for select 
  using (auth.uid() = user_id or user_id is null);

create policy "Coaches/Admins can create notifications" 
  on public.notifications for insert 
  with check (true); -- Ideally restrict to coach role, but for now open for dev
