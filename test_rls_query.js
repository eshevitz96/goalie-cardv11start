const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.local' });

// Sign JWT exactly like Supabase does
function generateUserJWT(userId, email) {
    const payload = {
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
        sub: userId,
        email: email,
        role: 'authenticated',
        app_metadata: {
            provider: 'email',
            providers: ['email']
        },
        user_metadata: {},
        role: 'authenticated'
    };
    return jwt.sign(payload, process.env.SUPABASE_JWT_SECRET);
}

async function testRlsQuery() {
    const userId = '14092722-0e2b-492b-866c-0f77e87469de';
    const email = 'eshevitz96@gmail.com';
    const token = generateUserJWT(userId, email);

    console.log("=== Initializing Client with Auth Token ===");
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            },
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        }
    );

    console.log("=== Querying users table as Authenticated User via RLS ===");
    const { data: userRes, error: userErr } = await supabase
        .from('users')
        .select('id, first_name, last_name, display_name, gc_number, primary_sport, teams, grad_year, handedness, profile_tags')
        .eq('auth_user_id', userId)
        .single();

    if (userErr) {
        console.error("SELECT query failed with error:", userErr);
    } else {
        console.log("SELECT query succeeded! Result:", userRes);
    }
}

testRlsQuery();
