require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserStatus(email) {
    console.log(`\n🔍 Checking status for: ${email}`);
    const emailLower = email.toLowerCase().trim();

    // 1. Check Profiles
    const { data: profile } = await adminClient
        .from('profiles')
        .select('id, role')
        .eq('email', emailLower)
        .single();

    if (profile) {
        console.log(`   -> Found Profile: ${profile.id} (Role: ${profile.role})`);
        return { exists: true, role: profile.role, rosterStatus: 'linked' };
    }

    // 2. Check Roster
    const { data: roster } = await adminClient
        .from('roster_uploads')
        .select('id, is_claimed')
        .ilike('email', emailLower)
        .maybeSingle();

    if (roster) {
        console.log(`   -> Found Roster Upload: ${roster.id} (Claimed: ${roster.is_claimed})`);
        return { exists: false, rosterStatus: 'found' };
    }

    console.log(`   -> No Profile or Roster found.`);
    return { exists: false, rosterStatus: 'not_found' };
}

async function run() {
    console.log("🧪 Verifying Smart Login Flow...");

    // Test 1: Admin User (Should Exist)
    const adminEmail = 'admin.test.user@goalieguard.com';
    const adminStatus = await checkUserStatus(adminEmail);

    if (adminStatus.exists) {
        console.log("✅ Admin correctly identified as Existing User.");
        console.log("   -> Simulate 'Stage 2': Password Login...");

        const { data, error } = await supabase.auth.signInWithPassword({
            email: adminEmail,
            password: 'password123'
        });

        if (error) {
            console.error("❌ Admin Login Failed:", error.message);
        } else {
            console.log("✅ Admin Login Success!");
            console.log("   -> User Role in JWT:", data.user.role); // 'authenticated'
            // We can check profile role again if needed using data.user.id
        }
    } else {
        console.error("❌ Admin NOT found during checkStatus!");
    }

    // Test 2: New User (Should be New)
    const newEmail = 'brand.new.user@goalieguard.com';
    const newStatus = await checkUserStatus(newEmail);

    if (!newStatus.exists) {
        console.log("✅ New User correctly identified as New.");
        console.log("   -> UI should redirect to /activate");
    } else {
        console.error("❌ New User INCORRECTLY identified as Existing!");
    }

}

run();
