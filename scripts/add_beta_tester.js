
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("🆕 Add New Beta Tester to Roster\n");

rl.question("Goalie Name: ", (name) => {
    rl.question("Email: ", (email) => {
        rl.question("DOB (YYYY-MM-DD): ", async (dob) => {

            console.log("\nAdding to roster_uploads...");

            const { error } = await supabase.from('roster_uploads').insert({
                goalie_name: name,
                email: email,
                school_team: "Beta Testers",
                unique_pwd: dob
            });

            if (error) {
                console.error("❌ Error:", error.message);
            } else {
                console.log("✅ Success! User added.");
                console.log(`👉 Go to: http://localhost:3005/activate`);
                console.log(`👉 Enter Email: ${email}`);
                console.log(`👉 Verify DOB: ${dob}`);
            }

            rl.close();
        });
    });
});
