const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function applyMigration() {
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260922000000_atomic_protocol_pi_sync.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    const urls = [
        process.env.DATABASE_URL,
        process.env.POSTGRES_URL,
        process.env.SUPABASE_DB_URL,
        'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
        'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
    ].filter(Boolean);

    let success = false;
    for (const url of urls) {
        console.log(`Attempting connection to DB...`);
        const client = new Client({
            connectionString: url,
            ssl: url.includes('supabase.co') ? { rejectUnauthorized: false } : undefined
        });

        try {
            await client.connect();
            console.log("Connected! Applying migration SQL...");
            await client.query(sql);
            console.log("Migration applied successfully!");
            await client.end();
            success = true;
            break;
        } catch (err) {
            console.warn(`Connection failed or query error: ${err.message}`);
            try { await client.end(); } catch (e) {}
        }
    }

    if (!success) {
        console.error("Failed to connect to postgres via connection strings. Trying Supabase client RPC or exec...");
    }
}

applyMigration();
