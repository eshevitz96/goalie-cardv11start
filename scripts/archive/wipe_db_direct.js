
const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
});

async function wipe() {
    console.log("🔥 Connecting to LOCAL Postgres to FORCE WIPE...");
    try {
        await client.connect();

        // Truncate cascades to satisfy FKs (sessions linked to roster)
        const sql = "TRUNCATE TABLE public.roster_uploads, public.sessions RESTART IDENTITY CASCADE;";

        console.log("Executing:", sql);
        await client.query(sql);
        console.log("✅ Tables Truncated successfully.");

    } catch (err) {
        console.error("❌ Wipe Failed:", err);
    } finally {
        await client.end();
    }
}

wipe();
