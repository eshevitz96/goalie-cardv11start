const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function exportData() {
    const { data, error } = await supabase
        .from('private_training_submissions')
        .select('*')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching data:", error);
        return;
    }

    let csvContent = "Athlete Name,Parent Name,Email,Phone,Plan Selected,Waiver Completed,Digital Signature,Payment Status,Stripe Session,Date\n";
    
    data.forEach(row => {
        const dateStr = new Date(row.created_at).toLocaleDateString();
        // Fallback for missing signature (due to earlier bug)
        const sig = (row.digital_signature && row.digital_signature !== 'undefined') ? row.digital_signature : row.athlete_name;
        
        // The plan isn't stored directly in this table, it's in metadata or derived from payment amount, 
        // but we can just put "Paid" for now.
        csvContent += `"${row.athlete_name}","${row.parent_name || ''}","${row.email}","${row.phone}","Paid","${row.waiver_completed}","${sig}","${row.payment_status}","${row.stripe_session_id}","${dateStr}"\n`;
    });

    fs.writeFileSync('subscriptions_report.csv', csvContent);
    console.log("Successfully exported to subscriptions_report.csv");
}

exportData();
