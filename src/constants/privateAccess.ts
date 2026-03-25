export const PRIVATE_ACCESS_CONFIG = {
    // Access codes that are valid for the flow
    validCodes: ['GOALIE2026', 'ELITE-ACCESS-2026', 'TGB-PRIVATE-101'],
    
    // Stripe Product IDs (Can be moved to .env later)
    stripe: {
        livePriceId: process.env.STRIPE_LIVE_PRICE_ID || 'price_1RikwWGj0SdRYIlhBFkwodnf', // Placeholder from .env if exists
        testPriceId: process.env.STRIPE_TEST_PRICE_ID || 'price_1RikwWGj0SdRYIlhBFkwodnf', // Placeholder for $1 test
        isTestMode: process.env.NEXT_PUBLIC_STRIPE_TEST_MODE === 'true',
    },
    
    trainingTerms: {
        mainWaiver: `In consideration of being allowed to participate in the event or activity referenced above, I acknowledge, appreciate, and agree that:

1) The risk of injury from the activities involved in this program is significant, including the potential for permanent paralysis and death, and while particular rules, equipment, and personal discipline may reduce this risk, the risk of serious injury does exist; and,

2) I KNOWINGLY AND FREELY ASSUME ALL SUCH RISKS, both known and unknown, EVEN IF ARISING FROM THE NEGLIGENCE OF THE RELEASEES or others, and assume full responsibility for my participation; and,

3) I willingly agree to comply with the stated and customary terms and conditions for participation. If, however, I observe any unusual significant hazard during my presence or participation, I will remove myself from participation and bring such to the attention of the nearest official immediately; and,

4) I, for myself and on behalf of my heirs, assigns, personal representatives and next of kin, HEREBY RELEASE AND HOLD HARMLESS the Releasees, their officers, officials, agents, and/or employees, other participants, sponsoring agencies, sponsors, advertisers, and if applicable, owners and lessors of premises used to conduct the event ("RELEASEES"), WITH RESPECT TO ANY AND ALL INJURY, DISABILITY, DEATH, or loss or damage to person or property, WHETHER ARISING FROM THE NEGLIGENCE OF THE RELEASEES OR OTHERWISE, to the fullest extent permitted by law.`,
        
        paymentPolicy: `By signing below, I acknowledge that I have voluntarily enrolled in services provided by The Goalie Brand:
1. Payment Requirement: Full payment is required in advance to reserve any lesson, session, or clinic/event spot.
2. No Refund Policy: All payments are non-refundable. This includes, but is not limited to, cancellations due to illness, injury, scheduling conflicts, or weather-related issues.
3. Transfer Policy: Request must be made at least 48 hours in advance and space is available.
4. Legal Exceptions: Refunds may be considered only in extraordinary circumstances (e.g., documented medical emergencies with official physician verification).`,
        
        codeOfConduct: `I acknowledge that this Sports Training Session may carry with it the potential for death, serious injury, and personal loss. The risks may include, but are not limited to, those caused by terrain, facilities, temperature, weather, condition of participants, equipment, vehicular traffic, actions of other people including, but not limited to, participants, volunteers, spectators, coaches, and lack of hydration. I certify that I am physically fit and have not been advised NOT to participate by a qualified medical professional.`,
        
        liabilityWaiver: `I WAIVE, RELEASE, AND DISCHARGE from any and all liability, including but not limited to, liability arising from the negligence or fault of the entities or persons released, for my death, disability, personal injury, property damage, property theft, or actions of any kind. This includes THE FOLLOWING ENTITIES OR PERSONS: The Goalie Brand, Common Intellectual Creators, Elliott Shevitz, and/or their coaches, agents, representatives or volunteers.`
    }
};
