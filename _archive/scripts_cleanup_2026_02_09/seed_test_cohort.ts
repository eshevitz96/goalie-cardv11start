
import { Client } from 'pg';

const connectionString = 'postgresql://postgres:postgres@127.0.0.1:5432/postgres';

const testUsers = [
    {
        email: 'test.pro@example.com',
        goalie_name: 'Pro Tester',
        grad_year: 2015,
        team: 'Boston Bruins',
        assigned_unique_id: 'GC-TEST-PRO',
        is_claimed: false
    },
    {
        email: 'test.college@example.com',
        goalie_name: 'College Tester',
        grad_year: 2024,
        team: 'Yale Bulldogs',
        assigned_unique_id: 'GC-TEST-COL',
        is_claimed: false
    },
    {
        email: 'test.hs@example.com',
        goalie_name: 'HS Tester',
        grad_year: 2027,
        team: 'Local High School',
        assigned_unique_id: 'GC-TEST-HS',
        is_claimed: false
    },
    {
        email: 'test.ms@example.com',
        goalie_name: 'MS Tester',
        grad_year: 2031,
        team: 'Local Middle School',
        assigned_unique_id: 'GC-TEST-MS',
        is_claimed: false
    }
];

async function seed() {
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log("Connected to DB.");

        for (const user of testUsers) {
            // Check existence
            const res = await client.query('SELECT id FROM roster_uploads WHERE email = $1', [user.email]);

            if (res.rows.length > 0) {
                console.log(`User ${user.email} exists. Updating...`);
                await client.query(
                    'UPDATE roster_uploads SET is_claimed = $1, grad_year = $2, team = $3 WHERE id = $4',
                    [user.is_claimed, user.grad_year, user.team, res.rows[0].id]
                );
            } else {
                console.log(`Creating ${user.email}...`);
                await client.query(
                    'INSERT INTO roster_uploads (email, goalie_name, grad_year, team, assigned_unique_id, is_claimed, sport) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [user.email, user.goalie_name, user.grad_year, user.team, user.assigned_unique_id, user.is_claimed, 'Hockey']
                );
            }
        }

        console.log("\nDone! Users ready.");
        testUsers.forEach(u => console.log(`- ${u.goalie_name}: ${u.email}`));

    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await client.end();
    }
}

seed();
