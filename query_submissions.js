const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
    const { data, error } = await supabase
        .from('private_training_submissions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching data:", error);
    } else {
        console.log(`Found ${data.length} total submissions.`);
        const paid = data.filter(d => d.payment_status === 'paid');
        console.log(`Found ${paid.length} PAID submissions.`);
        
        if (paid.length > 0) {
            console.log("\nRecent Paid Submissions:");
            paid.slice(0, 3).forEach(d => {
                console.log(`- ${d.athlete_name} | Email: ${d.email} | Signature: "${d.digital_signature}" | Stripe Session: ${d.stripe_session_id}`);
            });
        }
    }
}

checkData();
