import { Client } from 'pg';

const sql = `
UPDATE public.roster_uploads
SET email = 'thegoaliebrand@gmail.com'
WHERE id = 'e5b8471e-72eb-4b2b-8680-ee922a43e850';
`;

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
    });

    try {
        await client.connect();
        await client.query(sql);
        console.log("Luke's email updated to thegoaliebrand@gmail.com successfully!");
    } catch (err) {
        console.error("Failed:", err);
    } finally {
        await client.end();
    }
}

run();
