const jwt = require('jsonwebtoken');

const SECRET = 'process.env.SUPABASE_JWT_SECRET';

// Variant C: Minimal
const payloadC = {
    "role": "service_role",
    "exp": Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365 * 10)
};

try {
    const tokenC = jwt.sign(payloadC, SECRET);
    console.log("TOKEN_C:", tokenC);
} catch (err) {
    console.error("Error signing:", err);
}
