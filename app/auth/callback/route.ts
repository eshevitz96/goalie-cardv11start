import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const type = searchParams.get("type");

    // Default to /dashboard, but if recovery flow, go to update-password
    let next = searchParams.get("next") ?? "/dashboard";
    if (type === "recovery" && next === "/dashboard") {
        next = "/update-password";
    }

    console.log(`[Auth Callback] Origin: ${origin}, Next: ${next}, Has Code: ${!!code}`);

    if (code) {
        const supabase = createClient();
        console.log(`[Auth Callback] Exchanging code for session...`);
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // --- START AUTO-RECOGNITION LOGIC ---
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                // 1. Check if profile already exists
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', user.id)
                    .maybeSingle();

                if (!profile) {
                    console.log(`[Auth Callback] No profile found for ${user.email}. Checking card registry...`);
                    // 2. Check for card in roster_uploads
                    const { data: card } = await supabase
                        .from('roster_uploads')
                        .select('*')
                        .ilike('email', user.email)
                        .maybeSingle();

                    if (card) {
                        console.log(`[Auth Callback] Card found! Auto-provisioning profile for ${card.goalie_name}`);
                        // 3. Auto-provision profile from card data
                        await supabase
                            .from('profiles')
                            .insert({
                                id: user.id,
                                email: user.email,
                                goalie_name: card.goalie_name,
                                role: 'goalie',
                                sport: card.sport || 'Hockey'
                            });

                        // 4. Link card to user
                        await supabase
                            .from('roster_uploads')
                            .update({ linked_user_id: user.id, is_claimed: true })
                            .eq('id', card.id);
                    } else {
                        // 5. No card found -> Redirect to Activate
                        console.log(`[Auth Callback] No card found. Redirecting to activation wizard.`);
                        next = '/activate';
                    }
                }
            }
            // --- END AUTO-RECOGNITION LOGIC ---

            const forwardedHost = request.headers.get("x-forwarded-host");
            const isLocalEnv = process.env.NODE_ENV === "development";

            let redirectUrl: string;
            if (isLocalEnv) {
                redirectUrl = `${origin}${next}`;
            } else if (forwardedHost) {
                redirectUrl = `https://${forwardedHost}${next}`;
            } else {
                redirectUrl = `${origin}${next}`;
            }

            console.log(`[Auth Callback] Success! Redirecting to: ${redirectUrl}`);
            return NextResponse.redirect(redirectUrl);
        }

        console.error(`[Auth Callback] Exchange error:`, error.message);
    } else {
        console.warn(`[Auth Callback] No auth code found in request params.`);
    }

    // fallback to error page
    console.log(`[Auth Callback] Failure. Redirecting to auth-code-error page.`);
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
