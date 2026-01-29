-- Seed Events Data
-- This script populates the 'events' table with some initial data for testing.

insert into public.events (name, date, location, status, image)
values 
  ('King of the South Showcase (Mug Dawgs U14)', '2026-05-30 08:00:00+00', 'Alpharetta, GA', 'open', 'from-orange-500 to-red-600'),
  ('Goaliesmith: Charlotte 5-in-2 (Youth)', '2026-02-15 09:00:00+00', 'Charlotte, NC', 'open', 'from-pink-500 to-rose-600'),
  ('Circle K Classic (St. Louis AAA Blues)', '2026-12-27 10:00:00+00', 'Calgary, AB', 'open', 'from-blue-600 to-indigo-600');
