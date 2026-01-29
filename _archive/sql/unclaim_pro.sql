-- Unclaim the Pro Card so the Activation Demo works naturally
update public.roster_uploads 
set is_claimed = false 
where assigned_unique_id = 'GC-PRO-HKY';
