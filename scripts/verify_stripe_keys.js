require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

async function verifyStripe() {
    console.log("--- STRIPE V11 KEY VALIDATION ---");
    
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const pubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!secretKey) {
        console.error("[ERROR] STRIPE_SECRET_KEY is missing from .env.local");
        return;
    }
    if (!pubKey) {
        console.error("[ERROR] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing from .env.local");
        return;
    }

    console.log(`[INFO] Pub Key Prefix: ${pubKey.substring(0, 7)}...`);
    console.log(`[INFO] Secret Key Prefix: ${secretKey.substring(0, 7)}...`);

    const stripe = new Stripe(secretKey);

    try {
        const account = await stripe.accounts.retrieve();
        console.log(`[SUCCESS] Connected to Stripe Account: ${account.id} (${account.business_profile?.name || 'Unnamed Business'})`);
        
        // Check for common V11 price IDs
        const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
        if (priceId) {
            try {
                const price = await stripe.prices.retrieve(priceId);
                console.log(`[SUCCESS] Price ID ${priceId} validated: $${price.unit_amount / 100} ${price.currency.toUpperCase()}`);
            } catch (err) {
                console.warn(`[WARNING] Price ID ${priceId} could not be retrieved. Ensure it exists in this Stripe account.`);
            }
        }
    } catch (err) {
        console.error(`[ERROR] Stripe Key Check Failed: ${err.message}`);
        if (err.message.includes("Invalid API Key")) {
            console.error("   ADVICE: Check if your secret key starts with 'sk_live_' and contains no extra characters or typos.");
        }
    }
    
    console.log("--- VALIDATION COMPLETE ---");
}

verifyStripe();
