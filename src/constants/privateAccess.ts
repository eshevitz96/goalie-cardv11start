export const PRIVATE_ACCESS_CONFIG = {
    // Access codes that are valid for the flow
    validCodes: ['GOALIE2026', 'ELITE-ACCESS-2026', 'TGB-PRIVATE-101'],
    
    // Stripe Product IDs (Can be moved to .env later)
    stripe: {
        livePriceId: process.env.STRIPE_LIVE_PRICE_ID || 'price_1RikwWGj0SdRYIlhBFkwodnf', // Placeholder from .env if exists
        testPriceId: process.env.STRIPE_TEST_PRICE_ID || 'price_1RikwWGj0SdRYIlhBFkwodnf', // Placeholder for $1 test
        isTestMode: process.env.NEXT_PUBLIC_STRIPE_TEST_MODE === 'true',
    },
    
    // Training terms content
    trainingTerms: {
        availability: "Training scheduling is based on availability and will be coordinated after payment is confirmed.",
        limitations: "Access is limited to the individual goalie specified in the registration.",
        productType: "Product is for private in-person training access only.",
        refundPolicy: "Refunds are subject to our standard training cancellation policy. Please contact support for details."
    }
};
