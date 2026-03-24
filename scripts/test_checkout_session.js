require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
    console.error("Missing STRIPE_SECRET_KEY in .env.local");
    process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

async function createTestSession() {
    try {
        console.log("Generating a Test Checkout Session...");
        
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "Goalie Card - Real Test Transaction",
                            description: "Verification of Stripe integration."
                        },
                        unit_amount: 100, // $1.00 for a real-world test if needed, or 1000 for $10
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                userId: "test-user-123",
                test: "true"
            },
            success_url: "http://localhost:3000?success=true",
            cancel_url: "http://localhost:3000?canceled=true",
        });

        console.log("\n✅ Test Session Created Successfully!");
        console.log("-----------------------------------------");
        console.log("USE THIS URL TO TEST THE CHECKOUT PAGE:");
        console.log(session.url);
        console.log("-----------------------------------------\n");

    } catch (error) {
        console.error("Error creating test session:", error.message);
    }
}

createTestSession();
