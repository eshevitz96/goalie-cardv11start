
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        // FORCE SERVICE ROLE KEY - CRITICAL FOR ADMIN OPS
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseKey) {
            console.error("MISSING SUPABASE_SERVICE_ROLE_KEY");
            throw new Error("Missing Service Role Key");
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        console.log("Resetting password for Elliott...");

        // 1. Get User by Email
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const elliott = users.find(u => u.email === 'thegoaliebrand@gmail.com');

        if (elliott) {
            // Update Password
            const { error: updateError } = await supabase.auth.admin.updateUserById(
                elliott.id,
                { password: 'goalie123', email_confirm: true }
            );
            if (updateError) throw updateError;
            return NextResponse.json({ success: true, message: "Updated existing user password" });
        } else {
            // Create User
            const { error: createError } = await supabase.auth.admin.createUser({
                email: 'thegoaliebrand@gmail.com',
                password: 'goalie123',
                email_confirm: true
            });
            if (createError) throw createError;
            return NextResponse.json({ success: true, message: "Created new user with password" });
        }
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
