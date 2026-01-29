-- Secure the Roster Uploads Table
-- The previous manual policy was too permissive. This restricts updates to the row owner.

drop policy if exists "Allow public update of roster" on public.roster_uploads;
drop policy if exists "Users can update own roster" on public.roster_uploads;

create policy "Users can update own roster" on public.roster_uploads for update using (
  lower(email) = lower(auth.jwt() ->> 'email')
);
