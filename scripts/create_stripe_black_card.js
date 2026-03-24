require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
    console.error("Missing STRIPE_SECRET_KEY in .env.local");
    process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

async function createBlackCard() {
    try {
        console.log("Creating Black Card Tier Product (Elite of the Elite)...");
        const product = await stripe.products.create({
            name: 'Goalie Card BLACK CARD',
            description: 'Elite of the Elite ($900/mo) - Premier mentorship, full analytics, and 24/7 technical feedback.',
            metadata: {
                tier: 'black_card'
            }
        });

        console.log(`Product created: ${product.id}`);

        console.log("Creating Price for Product...");
        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: 90000, // $900 in cents
            currency: 'usd',
            recurring: {
                interval: 'month',
            },
            lookup_key: 'black_card_monthly',
        });

        console.log(`Price created successfully!`);
        console.log(`\n================================`);
        console.log(`=> BLACK_CARD_PRICE_ID: ${price.id}`);
        console.log(`================================\n`);

    } catch (error) {
        console.error("Error creating Stripe product/price:", error.message);
    }
}

createBlackCard();
