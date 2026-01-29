
alter table public.sessions 
add column if not exists location text,
add column if not exists start_time time,
add column if not exists end_time time,
add column if not exists date date,
add column if not exists notes text;

