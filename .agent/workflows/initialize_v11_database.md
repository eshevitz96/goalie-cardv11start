---
description: Initialize the V11 Video Intelligence Database (Events & Shot Tags)
---

To enable the mandatory event-anchored film threading, you MUST run the following SQL in your Supabase SQL Editor. This creates the relationship between sessions, film clips, and technical shot tags.

### 1. Create the Events Table
This table stores session-level metadata (Games, Practices) and athlete reflections.

```sql
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roster_id UUID REFERENCES public.rosters(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    type TEXT DEFAULT 'game', -- 'game', 'practice', 'scout'
    journal_entry TEXT,
    readiness_score INTEGER,
    soreness_level INTEGER,
    sleep_hours DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 2. Create the Shot Events Table
This table stores individual film clips ("threads") and their technical plotting data.

```sql
CREATE TABLE IF NOT EXISTS public.shot_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    roster_id UUID REFERENCES public.rosters(id) ON DELETE CASCADE,
    film_url TEXT NOT NULL,
    clip_start DECIMAL NOT NULL DEFAULT 0,
    clip_end DECIMAL,
    result TEXT NOT NULL, -- 'save', 'goal', 'clear'
    shot_type TEXT, -- 'wrist', 'slap', 'bounce', etc.
    origin_x DECIMAL,
    origin_y DECIMAL,
    target_x DECIMAL,
    target_y DECIMAL,
    period INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 3. Enable Real-time Sync
Run this to ensure the Goalie Dashboard updates instantly when you finish charting a shot.

```sql
alter publication supabase_realtime add table shot_events;
alter publication supabase_realtime add table events;
```

---
**Workflow Notes:**
1. **Upload**: User creates/selects an `event` before uploading `film_url`.
2. **Threading**: In the analysis workspace, each technical tag creates a `shot_event` linked to that `event_id`.
3. **Sorting**: The Dashboard automatic groups these via the `event_id` foreign key.
