require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
    console.error("Missing STRIPE_SECRET_KEY in .env.local");
    process.exit(1);
}
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

const products = [
    {
        name: 'Hybrid Retainer',
        description: '$300/mo - Includes 4 lessons, video feedback, and custom plans.',
        amount: 30000,
        lookup_key: 'hybrid_retainer'
    },
    {
        name: 'B2C Pro SaaS',
        description: '$15/mo - Game/Practice scheduling, AI Expert Engine, Custom Drills.',
        amount: 1500,
        lookup_key: 'b2c_pro_saas'
    },
    {
        name: 'Coach Starter',
        description: '$49/mo - Up to 10 athletes.',
        amount: 4900,
        lookup_key: 'coach_starter'
    },
    {
        name: 'Coach Pro',
        description: '$99/mo - Up to 50 athletes.',
        amount: 9900,
        lookup_key: 'coach_pro'
    },
    {
        name: 'Coach Elite',
        description: '$199/mo - Unlimited athletes + Assistant logins.',
        amount: 19900,
        lookup_key: 'coach_elite'
    }
];

async function syncProducts() {
    for (const p of products) {
        try {
            console.log(`Creating product: ${p.name}...`);
            const product = await stripe.products.create({
                name: p.name,
                description: p.description,
            });

            await stripe.prices.create({
                product: product.id,
                unit_amount: p.amount,
                currency: 'usd',
                recurring: { interval: 'month' },
                lookup_key: p.lookup_key,
            });
            console.log(`✅ ${p.name} created!`);
        } catch (e) {
            console.error(`❌ Error creating ${p.name}: ${e.message}`);
        }
    }
}

syncProducts();
