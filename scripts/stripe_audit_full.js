/**
 * stripe_audit_full.js — READ ONLY
 * 
 * Pulls ALL Stripe subscriptions (all statuses) and searches for customers
 * by name/email to catch anything missed in the active-only pull.
 * 
 * Run: node scripts/stripe_audit_full.js
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

async function auditAll() {
    console.log('\n========================================');
    console.log('  STRIPE FULL AUDIT — ALL STATUSES');
    console.log('  READ-ONLY: No changes being made');
    console.log('========================================\n');

    const allStatuses = ['active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'paused'];
    
    const allSubs = [];

    for (const status of allStatuses) {
        let hasMore = true;
        let startingAfter = undefined;

        while (hasMore) {
            const page = await stripe.subscriptions.list({
                status,
                limit: 100,
                expand: ['data.customer', 'data.items.data.price'],
                starting_after: startingAfter,
            });

            allSubs.push(...page.data);
            hasMore = page.has_more;
            if (hasMore) startingAfter = page.data[page.data.length - 1].id;
        }
    }

    // Deduplicate by sub ID
    const seen = new Set();
    const uniqueSubs = allSubs.filter(s => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
    });

    console.log(`Total subscriptions across all statuses: ${uniqueSubs.length}\n`);
    console.log('─'.repeat(100));

    for (const sub of uniqueSubs) {
        const customer = sub.customer;
        const custName = customer?.name || '(no name)';
        const custEmail = customer?.email || '(no email)';
        
        const renewalDate = new Date(sub.current_period_end * 1000).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const createdDate = new Date(sub.created * 1000).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        console.log(`  STATUS   : ${sub.status.toUpperCase()}`);
        console.log(`  Customer : ${custName} <${custEmail}>`);
        console.log(`  Sub ID   : ${sub.id}`);
        console.log(`  Created  : ${createdDate}`);

        for (const item of sub.items.data) {
            const price = item.price;
            const amount = (price.unit_amount / 100).toFixed(2);
            const interval = price.recurring
                ? `every ${price.recurring.interval_count} ${price.recurring.interval}(s)`
                : 'one-time';
            console.log(`    → $${amount} ${interval} | Price ID: ${price.id}`);
        }

        console.log(`  Renewal  : ${renewalDate}`);
        console.log('─'.repeat(100));
    }

    // Also search customers by name for Jay Bhoopathy
    console.log('\n🔍 CUSTOMER SEARCH — "bhoopathy"\n');
    const search = await stripe.customers.search({ query: 'name~"bhoopathy"', limit: 10 });
    if (search.data.length === 0) {
        console.log('  No customers found with that name. Trying email search...');
        
        // Try listing all customers and filtering
        const allCustomers = [];
        let hasCustMore = true;
        let custAfter = undefined;
        while (hasCustMore) {
            const page = await stripe.customers.list({ limit: 100, starting_after: custAfter });
            allCustomers.push(...page.data);
            hasCustMore = page.has_more;
            if (hasCustMore) custAfter = page.data[page.data.length - 1].id;
        }
        
        const matches = allCustomers.filter(c => 
            (c.name && c.name.toLowerCase().includes('jay')) ||
            (c.name && c.name.toLowerCase().includes('bhoopathy')) ||
            (c.email && c.email.toLowerCase().includes('bhoopathy'))
        );
        
        console.log(`  Found ${matches.length} matching customer(s):`);
        for (const c of matches) {
            console.log(`  → ${c.name} <${c.email}> — ID: ${c.id}`);
            
            // Pull their subscriptions
            const custSubs = await stripe.subscriptions.list({
                customer: c.id,
                status: 'all',
                expand: ['data.items.data.price'],
                limit: 10,
            });
            for (const s of custSubs.data) {
                const renewal = new Date(s.current_period_end * 1000).toLocaleDateString();
                console.log(`    Sub ${s.id} — status: ${s.status} — renewal: ${renewal}`);
                for (const item of s.items.data) {
                    const p = item.price;
                    console.log(`      $${(p.unit_amount/100).toFixed(2)} ${p.recurring ? `every ${p.recurring.interval_count} ${p.recurring.interval}(s)` : 'one-time'} | ${p.id}`);
                }
            }
        }
    } else {
        for (const c of search.data) {
            console.log(`  → ${c.name} <${c.email}> — ID: ${c.id}`);
            const custSubs = await stripe.subscriptions.list({
                customer: c.id,
                status: 'all',
                expand: ['data.items.data.price'],
                limit: 10,
            });
            for (const s of custSubs.data) {
                const renewal = new Date(s.current_period_end * 1000).toLocaleDateString();
                console.log(`    Sub ${s.id} — status: ${s.status} — renewal: ${renewal}`);
                for (const item of s.items.data) {
                    const p = item.price;
                    console.log(`      $${(p.unit_amount/100).toFixed(2)} ${p.recurring ? `every ${p.recurring.interval_count} ${p.recurring.interval}(s)` : 'one-time'} | ${p.id}`);
                }
            }
        }
    }

    console.log('\n✅ Full audit complete. No changes were made.\n');
}

auditAll().catch((err) => {
    console.error('❌ Full audit failed:', err.message);
    process.exit(1);
});
