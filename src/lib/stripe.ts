import Stripe from 'stripe';

const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        // Return a mock or handle during build
        return new Stripe('sk_test_placeholder_for_build', {
            apiVersion: '2025-01-27.acacia' as any,
            typescript: true,
        });
    }
    return new Stripe(key, {
        apiVersion: '2025-01-27.acacia' as any,
        typescript: true,
    });
};

export const stripe = getStripe();
