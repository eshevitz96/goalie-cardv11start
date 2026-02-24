const Stripe = require('stripe');
const stripe = new Stripe('sk_test_fake', {apiVersion: '2023-10-16'});

try {
  stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price_data: { currency: 'usd', product_data: { name: 'Test' }, unit_amount: 1000 }, quantity: 1 }],
    success_url: "http://localhost:3000?success=true",
    customer_email: undefined
  });
  console.log("Success");
} catch (e) {
  console.error("Error:", e.message);
}
