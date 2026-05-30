const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectSchema() {
    const query = `
        SELECT 
            table_schema, 
            table_name, 
            column_name, 
            data_type,
            is_nullable
        FROM 
            information_schema.columns
        WHERE 
            table_schema = 'public' 
            AND table_name IN ('game_reports', 'film_shots', 'film_clips', 'users', 'game_sessions')
        ORDER BY 
            table_name, 
            ordinal_position;
    `;

    const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: query
    });

    if (error) {
        console.error("Failed to query schema:", error.message);
    } else {
        console.log("Schema columns:");
        const grouped = {};
        data.forEach(row => {
            if (!grouped[row.table_name]) {
                grouped[row.table_name] = [];
            }
            grouped[row.table_name].push(`${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
        });
        console.log(JSON.stringify(grouped, null, 2));
    }
}

inspectSchema();
