const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function testEmail() {
    console.log("Testing Resend with key:", process.env.RESEND_API_KEY ? "Loaded" : "Missing");
    console.log("From Address:", process.env.EMAIL_FROM_ADDRESS);

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev",
                to: ["e@cmmncreators.com"], // Sending to admin for test
                subject: `Test Email from Goalie Card`,
                html: `<h2>This is a test email</h2><p>If you received this, Resend is working!</p>`
            }),
        });

        const data = await response.json();
        console.log("Response Status:", response.status);
        console.log("Response Data:", data);
        
        if (response.ok) {
            console.log("✅ Email sent successfully!");
        } else {
            console.error("❌ Failed to send email.");
        }
    } catch (error) {
        console.error("Error during fetch:", error);
    }
}

testEmail();
