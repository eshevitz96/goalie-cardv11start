import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createClient(supabaseUrl, supabaseKey);

        // SQL to add column
        const { error } = await supabase.rpc('exec_sql', {
            sql_query: `
            ALTER TABLE roster_uploads ADD COLUMN IF NOT EXISTS teams_data JSONB DEFAULT '[]'::jsonb;
        `
        });

        if (error) {
            // Fallback if exec_sql not available (it usually isn't enabled by default for security)
            // We can't really DDL via client easily.
            // We will try to just assume it works or use the "run_command" with a supported tool if any.
            // BUT wait, we can assume the user might have to run it. 
            // OR we can try to use standard postgres connection if we had the credentials. 
            // Since I can't run DDL, I will simulate it by telling the user or just proceeding.

            // Actually, many supabase checks allow `postgres` connection string if available.
            return NextResponse.json({ success: false, error: "DDL Execution not supported via Client. Please run SQL manually: ALTER TABLE roster_uploads ADD COLUMN IF NOT EXISTS teams_data JSONB;" });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message });
    }
}
