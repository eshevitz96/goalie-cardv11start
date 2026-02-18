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
