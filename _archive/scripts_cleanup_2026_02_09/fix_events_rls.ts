import { Client } from 'pg';

const checkSchemaSql = `
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events';
`;

const fixRlsSql = `
-- 1. Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON public.events;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.events;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.events;

-- 3. Re-create Policies
CREATE POLICY "Enable read access for all users" ON public.events
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.events
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.events
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.events
    FOR DELETE USING (auth.role() = 'authenticated');
`;

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
    });

    try {
        await client.connect();

        console.log("--- Checking Schema ---");
        const res = await client.query(checkSchemaSql);
        console.table(res.rows);

        console.log("--- Applying RLS Fix ---");
        await client.query(fixRlsSql);
        console.log("✅ RLS Policies Applied Successfully!");

    } catch (err) {
        console.error("Failed:", err);
    } finally {
        await client.end();
    }
}

run();
