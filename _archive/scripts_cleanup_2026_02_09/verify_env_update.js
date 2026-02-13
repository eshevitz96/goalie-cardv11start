require('dotenv').config({ path: '.env.local' });

const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log("--- ENV CHECK ---");
console.log("Key Found:", key.length > 0 ? "YES" : "NO");
console.log("Key Length:", key.length);
console.log("Key Start:", key.substring(0, 15) + "...");
console.log("Is JWT format (starts 'ey...')?:", key.startsWith('ey') ? "YES" : "NO");
console.log("--- END CHECK ---");
