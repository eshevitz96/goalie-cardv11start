/**
 * archive_old_prices.js
 *
 * Archives old recurring private-training catalog prices in Stripe.
 * Archiving sets `active: false`, which:
 *   - Prevents new checkouts from selecting them
 *   - Does NOT cancel or affect any existing subscriptions using them
 *
 * Run: node scripts/archive_old_prices.js
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

// The old recurring private-training catalog prices to archive.
// These are the pre-created prices in the Stripe product catalog — NOT the
// inline price_data prices (those live only on subscription items and are safe).
const PRICES_TO_ARCHIVE = [
    {
        id: 'price_1RikxNGj0SdRYIlhp44unK7I',
        description: '$400/month recurring (old catalog price)',
    },
    {
        id: 'price_1RikwWGj0SdRYIlhBFkwodnf',
        description: '$500 one-time (old placeholder — now replaced by new named price)',
    },
];

async function archivePrices() {
    console.log('\n========================================');
    console.log('  Archiving Old Stripe Prices');
    console.log('  Existing subscriptions NOT affected');
    console.log('========================================\n');

    for (const price of PRICES_TO_ARCHIVE) {
        console.log(`Archiving: ${price.id} — ${price.description}`);
        try {
            const updated = await stripe.prices.update(price.id, { active: false });
            console.log(`  ✅ Archived. active = ${updated.active}\n`);
        } catch (err) {
            console.error(`  ❌ Failed: ${err.message}\n`);
        }
    }

    console.log('✅ Archive complete. Existing subscriptions are unaffected.\n');
}

archivePrices().catch((err) => {
    console.error('❌ Archive script failed:', err.message);
    process.exit(1);
});
