import { Client } from 'pg';

const sql = `
-- 1. Add column
ALTER TABLE public.roster_uploads
ADD COLUMN IF NOT EXISTS goalie_email text;

-- 2. Update Test Goalies

-- Gabe Stone
UPDATE public.roster_uploads
SET goalie_email = 'gabriel.c.stone@gmail.com'
WHERE assigned_unique_id = 'GC-8266';

-- Madelyn Evans
UPDATE public.roster_uploads
SET goalie_email = 'maddog2027@icloud.com'
WHERE assigned_unique_id = 'GC-8622';

-- Jake Dewey
UPDATE public.roster_uploads
SET goalie_email = 'deweyjake25@gmail.com'
WHERE assigned_unique_id = 'GC-8372';

-- Luke Grasso
UPDATE public.roster_uploads
SET goalie_email = 'lukegrasso09@gmail.com'
WHERE assigned_unique_id = 'GC-8588';
`;

async function run() {
    // Try default supabase local port 54322
    let client = new Client({
        connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    });

    try {
        console.log("Connecting to 54322...");
        await client.connect();
        console.log("Connected.");
        await client.query(sql);
        console.log("Migration Successfully Applied!");
        await client.end();
        return;
    } catch (err: any) {
        console.error("Failed on 54322:", err.message);
        if (client) await client.end().catch(() => { });
    }

    // Fallback to 5432
    client = new Client({
        connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
    });

    try {
        console.log("Connecting to 5432...");
        await client.connect();
        console.log("Connected.");
        await client.query(sql);
        console.log("Migration Successfully Applied!");
    } catch (err: any) {
        console.error("Failed on 5432:", err.message);
        console.error("Could not connect to DB.");
        process.exit(1);
    } finally {
        await client.end().catch(() => { });
    }
}

run();
