require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
    console.error("Missing STRIPE_SECRET_KEY in .env.local");
    process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

async function createProTier() {
    try {
        console.log("Creating Pro Tier Product...");
        const product = await stripe.products.create({
            name: 'Goalie Card Pro Tier',
            description: 'Hybrid Retainer ($300/mo) - Includes 4 lessons, video feedback, and custom plans.',
        });

        console.log(`Product created: ${product.id}`);

        console.log("Creating Price for Product...");
        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: 30000, // $300 in cents
            currency: 'usd',
            recurring: {
                interval: 'month',
            },
            lookup_key: 'pro_tier_monthly',
        });

        console.log(`Price created successfully!`);
        console.log(`\n================================`);
        console.log(`=> PRICE_ID: ${price.id}`);
        console.log(`================================\n`);

    } catch (error) {
        console.error("Error creating Stripe product/price:", error.message);
    }
}

createProTier();
