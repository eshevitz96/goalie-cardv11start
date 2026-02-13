-- Link events.created_by to profiles.id for Role-Based filtering
ALTER TABLE events
ADD CONSTRAINT events_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES profiles(id)
ON DELETE SET NULL;
