import { Client } from 'pg';

const sql = `
ALTER TABLE public.roster_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow update for matching email" ON public.roster_uploads;

CREATE POLICY "Allow update for matching email" ON public.roster_uploads
FOR UPDATE
USING (
  lower(email) = lower(auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "Allow select for matching email" ON public.roster_uploads;
CREATE POLICY "Allow select for matching email" ON public.roster_uploads
FOR SELECT
USING (
  lower(email) = lower(auth.jwt() ->> 'email')
);
`;

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    });

    try {
        await client.connect();
        await client.query(sql);
        console.log("Policy Applied Successfully!");
    } catch (err) {
        console.error("Failed:", err);
    } finally {
        await client.end();
    }
}

run();
