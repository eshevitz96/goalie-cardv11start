const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
});

async function runMigration() {
    console.log("🐘 Connecting to LOCAL Postgres for Migration...");
    try {
        await client.connect();

        const migrationFile = path.join(__dirname, '../migrations/add_roles_column.sql');
        const sql = fs.readFileSync(migrationFile, 'utf8');

        console.log(`📜 Running migration: ${migrationFile}`);
        await client.query(sql);
        console.log("✅ Migration applied successfully.");

    } catch (err) {
        console.error("❌ Migration Failed:", err);
    } finally {
        await client.end();
    }
}

runMigration();
