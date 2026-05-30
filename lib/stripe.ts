import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;

let stripeInstance: Stripe | null = null;

export const getStripe = () => {
    if (stripeInstance) return stripeInstance;

    if (!key) {
        throw new Error("Missing STRIPE_SECRET_KEY environment variable. Please check your Vercel Dashboard Settings.");
    }

    stripeInstance = new Stripe(key, {
        apiVersion: '2025-01-27.acacia' as any,
        typescript: true,
    });

    return stripeInstance;
};

// Exporting the instance for routes and actions to use
export const stripe = getStripe();
