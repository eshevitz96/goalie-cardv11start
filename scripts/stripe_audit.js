/**
 * stripe_audit.js — READ ONLY
 * 
 * Pulls all active Stripe subscriptions and all prices (active/archived)
 * for the private training product. No data is modified.
 * 
 * Run: node scripts/stripe_audit.js
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

async function auditStripe() {
    console.log('\n========================================');
    console.log('  STRIPE AUDIT — Private Training');
    console.log('  READ-ONLY: No changes being made');
    console.log('========================================\n');

    // ── 1. All active subscriptions ──────────────────────────────────────────
    console.log('📋 ACTIVE SUBSCRIPTIONS\n');
    console.log('─'.repeat(80));

    let subscriptions = [];
    let hasMore = true;
    let startingAfter = undefined;

    while (hasMore) {
        const page = await stripe.subscriptions.list({
            status: 'active',
            limit: 100,
            expand: ['data.customer', 'data.items.data.price'],
            starting_after: startingAfter,
        });

        subscriptions.push(...page.data);
        hasMore = page.has_more;
        if (hasMore) startingAfter = page.data[page.data.length - 1].id;
    }

    if (subscriptions.length === 0) {
        console.log('  ⚠  No active subscriptions found.\n');
    } else {
        for (const sub of subscriptions) {
            const customer = sub.customer;
            const custName = customer?.name || '(no name)';
            const custEmail = customer?.email || '(no email)';
            
            // Renewal date
            const renewalDate = new Date(sub.current_period_end * 1000).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            
            // Items
            for (const item of sub.items.data) {
                const price = item.price;
                const amount = (price.unit_amount / 100).toFixed(2);
                const interval = price.recurring
                    ? `every ${price.recurring.interval_count} ${price.recurring.interval}(s)`
                    : 'one-time';
                const type = price.recurring ? 'RECURRING' : 'ONE-TIME';
                const priceNickname = price.nickname || price.id;
                
                console.log(`  Customer : ${custName} <${custEmail}>`);
                console.log(`  Sub ID   : ${sub.id}`);
                console.log(`  Price    : $${amount} — ${interval} [${type}]`);
                console.log(`  Price ID : ${price.id}`);
                console.log(`  Nickname : ${priceNickname}`);
                console.log(`  Renewal  : ${renewalDate}`);
                console.log(`  Status   : ${sub.status}`);
                console.log('─'.repeat(80));
            }
        }
        console.log(`\n  Total active subscriptions: ${subscriptions.length}\n`);
    }

    // ── 2. All prices (active + archived) ────────────────────────────────────
    console.log('\n💲 ALL STRIPE PRICES (ACTIVE + ARCHIVED)\n');
    console.log('─'.repeat(80));

    const allPricesActive = await stripe.prices.list({ limit: 100, active: true });
    const allPricesArchived = await stripe.prices.list({ limit: 100, active: false });
    const allPrices = [...allPricesActive.data, ...allPricesArchived.data];

    for (const price of allPrices) {
        const amount = (price.unit_amount / 100).toFixed(2);
        const interval = price.recurring
            ? `every ${price.recurring.interval_count} ${price.recurring.interval}(s)`
            : 'one-time';
        const type = price.recurring ? 'RECURRING' : 'ONE-TIME';
        const statusLabel = price.active ? '✅ ACTIVE' : '🔴 ARCHIVED';

        console.log(`  ${statusLabel} | $${amount} ${interval} [${type}]`);
        console.log(`  Price ID  : ${price.id}`);
        console.log(`  Nickname  : ${price.nickname || '(none)'}`);
        console.log(`  Product   : ${price.product}`);
        console.log(`  Created   : ${new Date(price.created * 1000).toLocaleDateString()}`);
        console.log('─'.repeat(80));
    }

    console.log('\n✅ Audit complete. No changes were made.\n');
}

auditStripe().catch((err) => {
    console.error('❌ Stripe audit failed:', err.message);
    process.exit(1);
});
