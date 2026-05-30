require('dotenv').config({ path: '.env.local' });

async function tryInsert() {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
    try {
        const response = await fetch(url);
        const swagger = await response.json();
        const seasonsDefinition = swagger.definitions?.seasons;
        if (seasonsDefinition) {
            console.log("Seasons properties:", Object.keys(seasonsDefinition.properties));
        }
    } catch (err) {
        console.error("Error fetching swagger definition:", err);
    }
}

tryInsert();
