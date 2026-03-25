import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export const getStripe = () => {
    if (stripeInstance) return stripeInstance;

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        throw new Error("Missing STRIPE_SECRET_KEY environment variable. Please check your Vercel Dashboard Settings.");
    }

    stripeInstance = new Stripe(key, {
        apiVersion: '2025-01-27.acacia' as any,
        typescript: true,
    });

    return stripeInstance;
};

// Exporting the function for actions to use
export const stripe = null as any; // No longer the primary way to access stripe
