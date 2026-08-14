"use server";

import { getSupabaseAdmin } from "@/utils/supabase/admin";
import { headers } from "next/headers";

export async function sendMagicLink(email: string) {
    if (!email) {
        return { success: false, error: "Email address is required." };
    }

    const emailTrimmed = email.toLowerCase().trim();

    try {
        const headersList = await headers();
        const host = headersList.get("host") || "localhost:3000";
        const proto = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
        const origin = `${proto}://${host}`;

        console.log(`[Auth Action] Generating magic link for ${emailTrimmed} with redirect origin: ${origin}`);

        const supabaseAdmin = getSupabaseAdmin();
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email: emailTrimmed,
            options: {
                redirectTo: `${origin}/auth/callback`
            }
        });

        if (error) {
            console.error("[Auth Action] Supabase link generation failed:", error.message);
            return { success: false, error: error.message };
        }

        const actionLink = data.properties.action_link;
        let tokenHash: string | null = data.properties.hashed_token || null;
        if (!tokenHash && actionLink) {
            try {
                const urlObj = new URL(actionLink);
                tokenHash = urlObj.searchParams.get("token");
            } catch (urlErr) {
                console.warn("[Auth Action] Failed to parse actionLink URL:", urlErr);
            }
        }

        if (!tokenHash) {
            return { success: false, error: "Failed to generate security token hash." };
        }

        const cleanTokenHash: string = tokenHash;
        const confirmationLink = `${origin}/auth/callback?token_hash=${cleanTokenHash}&type=magiclink&next=/dashboard`;
        console.log(`[Auth Action] Link generated successfully: ${confirmationLink}. Sending via Resend...`);

        // HTML email template matching the classy light theme
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sign in to Goalie Card</title>
  <style>
    body {
      background-color: #F8FAFC;
      color: #0F172A;
      font-family: "Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      padding: 40px 0;
      background-color: #F8FAFC;
    }
    .container {
      max-width: 480px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 24px;
      padding: 48px;
      box-shadow: 0 8px 32px rgba(15, 23, 42, 0.04);
      text-align: center;
    }
    .logo {
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #006747;
      margin-bottom: 32px;
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      line-height: 1.2;
      color: #0F172A;
      margin: 0 0 16px 0;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #64748B;
      margin: 0 0 32px 0;
    }
    .button-container {
      margin-bottom: 32px;
    }
    .btn {
      display: inline-block;
      background-color: #006747;
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 16px 36px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 103, 71, 0.2);
    }
    .footer {
      font-size: 11px;
      color: #A0AEC0;
      line-height: 1.5;
      border-top: 1px solid #EDF2F7;
      padding-top: 24px;
      margin-top: 8px;
    }
    .footer a {
      color: #006747;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="logo">GOALIE CARD</div>
      <h1>Your Access Portal</h1>
      <p>Tap the button below to log in securely and access your Goalie Card dashboard.</p>
      
      <div class="button-container">
        <a href="${confirmationLink}" class="btn">Access Dashboard</a>
      </div>
      
      <div class="footer">
        This secure link is valid for 24 hours. If you did not request this link, you can safely ignore this email.
      </div>
    </div>
  </div>
</body>
</html>
        `;

        const resendApiKey = process.env.RESEND_API_KEY;
        const fromAddress = process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev";

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
                from: fromAddress,
                to: [emailTrimmed],
                subject: "Secure Access Link - Goalie Card",
                html: emailHtml
            })
        });

        const resData = await res.json();

        if (res.ok) {
            console.log(`[Auth Action] Magic link email sent successfully. Resend ID: ${resData.id}`);
            return { success: true };
        } else {
            console.error("[Auth Action] Resend email transmission failed:", resData);
            return { success: false, error: resData.message || "Failed to deliver magic link email." };
        }
    } catch (e: any) {
        console.error("[Auth Action] Exception in sendMagicLink:", e);
        return { success: false, error: e.message || "An unexpected error occurred." };
    }
}
