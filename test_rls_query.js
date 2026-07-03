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
        console.error("SELECT users query failed with error:", userErr);
    } else {
        console.log("SELECT users query succeeded! Result:", userRes);
        const publicUserId = userRes.id;

        console.log("\n=== Querying game_sessions table as Authenticated User via RLS ===");
        const { data: gamesRes, error: gamesErr } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('user_id', publicUserId);
        console.log("game_sessions count returned:", gamesRes ? gamesRes.length : 0, gamesErr || "");
        if (gamesRes) {
            gamesRes.forEach(g => console.log(` - game_session id: ${g.id}, user_id: ${g.user_id}, opponent: ${g.opponent}`));
        }

        const { count: gameSessionsCount, error: countErr } = await supabase
            .from('game_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', publicUserId);
        console.log("gameSessionsCount with head:true returned:", gameSessionsCount, countErr || "");

        console.log("\n=== Querying seasons table as Authenticated User via RLS ===");
        const { data: seasonsRes, error: seasonsErr } = await supabase
            .from('seasons')
            .select('*');
        console.log("seasons count returned:", seasonsRes ? seasonsRes.length : 0, seasonsErr || "");
        if (seasonsRes) {
            seasonsRes.forEach(s => console.log(` - season id: ${s.id}, user_id: ${s.user_id}, name: ${s.name}, sport: ${s.sport}`));
        }
    }
}

testRlsQuery();
