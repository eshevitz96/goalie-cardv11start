import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function inspectUser() {
    const email = "eshevitz96@gmail.com";
    console.log(`Inspecting DB for: ${email}`);

    const { data, error } = await supabase
        .from("roster_uploads")
        .select("*")
        .ilike("email", email);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (data.length === 0) {
        console.log("No records found.");
    } else {
        data.forEach((record, i) => {
            console.log(`\n--- Record ${i + 1} ---`);
            console.log(`ID: ${record.id}`);
            console.log(`Email: ${record.email}`);
            console.log(`Is Claimed: ${record.is_claimed}`);
            console.log(`Setup Complete (Top Level):`, record.setup_complete); // Check if this column exists
            console.log(`Raw Data Setup Complete:`, record.raw_data?.setup_complete);
            console.log(`Linked User ID: ${record.linked_user_id}`);
            console.log(`Raw Data:`, JSON.stringify(record.raw_data, null, 2));
        });
    }
}

inspectUser();
