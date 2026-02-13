
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const migrationPath = process.argv[2];
    if (!migrationPath) {
        console.error("Please provide migration file path");
        process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Try DATABASE_URL or construct connection string
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL not found in .env.local");
        process.exit(1);
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase in many cases
    });

    try {
        await client.connect();
        console.log(`Running migration: ${migrationPath}`);
        await client.query(sql);
        console.log("Migration applied successfully!");
    } catch (err) {
        console.error("Error applying migration:", err);
    } finally {
        await client.end();
    }
}

run();
