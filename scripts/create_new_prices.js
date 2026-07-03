/**
 * create_new_prices.js
 *
 * Creates two brand-new one-time (payment) prices in Stripe:
 *   - Private Training — 4 Session Block  @ $500.00
 *   - Private Training — 8 Session Block  @ $920.00
 *
 * Fees are absorbed into the gross price. No separate processing-fee line item.
 * Run: node scripts/create_new_prices.js
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

async function createPrices() {
    console.log('\n========================================');
    console.log('  Creating New One-Time Prices in Stripe');
    console.log('========================================\n');

    // ── 4 Session Block ───────────────────────────────────────────────────────
    console.log('Creating: Private Training — 4 Session Block ($500)...');
    const product4 = await stripe.products.create({
        name: 'Private Training — 4 Session Block',
        description: '4 private goalie training sessions ($125/session). One-time payment.',
        metadata: { type: 'private_training', sessions: '4', per_session: '125' },
    });

    const price4 = await stripe.prices.create({
        product: product4.id,
        unit_amount: 50000, // $500.00 in cents
        currency: 'usd',
        nickname: 'Private Training — 4 Session Block',
        // No `recurring` key = one-time payment price
        metadata: { type: 'private_training', sessions: '4', plan_id: 'block4' },
    });

    console.log(`  ✅ Product ID : ${product4.id}`);
    console.log(`  ✅ Price ID   : ${price4.id}`);
    console.log(`  ✅ Amount     : $${(price4.unit_amount / 100).toFixed(2)} — one-time\n`);

    // ── 8 Session Block ───────────────────────────────────────────────────────
    console.log('Creating: Private Training — 8 Session Block ($920)...');
    const product8 = await stripe.products.create({
        name: 'Private Training — 8 Session Block',
        description: '8 private goalie training sessions ($115/session). One-time payment.',
        metadata: { type: 'private_training', sessions: '8', per_session: '115' },
    });

    const price8 = await stripe.prices.create({
        product: product8.id,
        unit_amount: 92000, // $920.00 in cents
        currency: 'usd',
        nickname: 'Private Training — 8 Session Block',
        // No `recurring` key = one-time payment price
        metadata: { type: 'private_training', sessions: '8', plan_id: 'block8' },
    });

    console.log(`  ✅ Product ID : ${product8.id}`);
    console.log(`  ✅ Price ID   : ${price8.id}`);
    console.log(`  ✅ Amount     : $${(price8.unit_amount / 100).toFixed(2)} — one-time\n`);

    console.log('========================================');
    console.log('  COPY THESE IDs INTO .env.local');
    console.log('========================================');
    console.log(`STRIPE_PRICE_BLOCK4=${price4.id}`);
    console.log(`STRIPE_PRICE_BLOCK8=${price8.id}`);
    console.log('');
}

createPrices().catch((err) => {
    console.error('❌ Price creation failed:', err.message);
    process.exit(1);
});
