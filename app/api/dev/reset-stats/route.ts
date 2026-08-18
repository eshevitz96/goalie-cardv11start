import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
        .from('roster_uploads')
        .update({ games_count: 0, practice_count: 0 })
        .neq('id', '00000000-0000-0000-0000-000000000000');
        
    return NextResponse.json({ success: true, data, error });
}
