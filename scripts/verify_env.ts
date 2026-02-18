
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env.local manually to ensure we are checking the file on disk
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    console.log(`Loading env from: ${envPath}`);
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    // Merge into process.env so we can check
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} else {
    console.error("❌ .env.local file not found!");
    process.exit(1);
}

const REQUIRED_KEYS = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'OPENAI_API_KEY'
];

console.log("\n🔍 Verifying Environment Variables in .env.local...\n");

let missing = false;

REQUIRED_KEYS.forEach(key => {
    if (process.env[key]) {
        console.log(`✅ ${key} is set.`);
    } else {
        console.error(`❌ ${key} is MISSING.`);
        missing = true;
    }
});

if (missing) {
    console.log("\n⚠️  Some keys are missing. Please check .env.local");
    process.exit(1);
} else {
    console.log("\n✅ All required keys are present!");
}
