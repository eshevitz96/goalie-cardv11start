
import { Client } from 'pg';

async function testConnection(port: number) {
    console.log(`Testing connection on port ${port}...`);
    const client = new Client({
        connectionString: `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`,
        connectionTimeoutMillis: 2000,
    });

    try {
        await client.connect();
        console.log(`✅ Success on port ${port}`);
        await client.end();
        return true;
    } catch (err: any) {
        console.log(`❌ Failed on port ${port}: ${err.message}`);
        return false;
    }
}

async function run() {
    await testConnection(5432);
    await testConnection(54322);
}

run();
