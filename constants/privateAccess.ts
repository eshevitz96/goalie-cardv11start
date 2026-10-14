export type AccessPath = 'founding' | 'new-clients';

export interface PlanDisplay {
    id: string;
    name: string;
    amount: number;
    amountFormatted: string;
    billingText: string;
    subtext: string;
    isRecurring: boolean;
    intervalCount?: number;
    isDefault?: boolean;
    badge?: string;
}

export const PRIVATE_ACCESS_CONFIG = {
    // Two paths, strictly chosen by access code (case-insensitive)
    codes: {
        founding: ['GOALIE2026'],
        newClients: ['GOALIE2027'],
    },

    // 1. FOUNDING PATH (code: goalie2026) -> Subscription checkout
    foundingPlans: {
        monthly: {
            id: 'monthly',
            name: 'Legacy Member',
            amount: 400,
            amountFormatted: '$400',
            billingText: '/month',
            subtext: '$400 billed monthly.',
            priceId: process.env.STRIPE_PRICE_FOUNDING_MONTHLY || 'price_1UDAoiGj0SdRYIlhOsXK48ej',
            interval: 'month' as const,
            intervalCount: 1,
            isRecurring: true,
            isDefault: false,
        },
        standard: {
            id: 'standard',
            name: 'Standard Block',
            amount: 1600,
            amountFormatted: '$1,600',
            billingText: 'every 4 months',
            subtext: '16 Lessons. $1,600 billed every 4 months.',
            priceId: process.env.STRIPE_PRICE_FOUNDING_STANDARD || 'price_1Tbj8BGj0SdRYIlhwsTBcAY9',
            interval: 'month' as const,
            intervalCount: 4,
            isRecurring: true,
            isDefault: false,
        },
        season: {
            id: 'season',
            name: 'Season Commitment',
            amount: 2400,
            amountFormatted: '$2,400',
            billingText: 'every 6 months',
            subtext: '24 Lessons. $2,400 billed every 6 months.',
            priceId: process.env.STRIPE_PRICE_FOUNDING_SEASON || 'price_1TEifdGj0SdRYIlhFBvlrMaT',
            interval: 'month' as const,
            intervalCount: 6,
            isRecurring: true,
            isDefault: false,
        },
    },

    // 2. NEW CLIENTS PATH (code: goalie2027)
    // Option A (default/highlighted): $500/month recurring subscription
    // Option B: $960 one-time payment
    newClientPlans: {
        'monthly-access': {
            id: 'monthly-access',
            name: 'Private Training',
            amount: 515.25,
            amountFormatted: '$515.25',
            billingText: '/month',
            subtext: '4 lessons a month. Unused roll over.',
            priceId: process.env.STRIPE_PRICE_MONTHLY_ACCESS || 'price_1UQV8gGj0SdRYIlhVjWEqsdk',
            interval: 'month' as const,
            intervalCount: 1,
            isRecurring: true,
            isDefault: true,
        },
        'block8': {
            id: 'block8',
            name: '8 Lessons',
            amount: 988.99,
            amountFormatted: '$988.99',
            billingText: 'one-time',
            subtext: '$120/lesson base. No subscription.',
            priceId: process.env.STRIPE_PRICE_BLOCK8 || 'price_1UQV8gGj0SdRYIlhRryQPRPs',
            isRecurring: false,
            isDefault: false,
        },
    },

    stripe: {
        isTestMode: process.env.NEXT_PUBLIC_STRIPE_TEST_MODE === 'true',
    },
    
    trainingTerms: {
        mainWaiver: `In consideration of being allowed to participate in the event or activity referenced above, I acknowledge, appreciate, and agree that:

1) The risk of injury from the activities involved in this program is significant, including the potential for permanent paralysis and death, and while particular rules, equipment, and personal discipline may reduce this risk, the risk of serious injury does exist; and,

2) I KNOWINGLY AND FREELY ASSUME ALL SUCH RISKS, both known and unknown, EVEN IF ARISING FROM THE NEGLIGENCE OF THE RELEASEES or others, and assume full responsibility for my participation; and,

3) I willingly agree to comply with the stated and customary terms and conditions for participation. If, however, I observe any unusual significant hazard during my presence or participation, I will remove myself from participation and bring such to the attention of the nearest official immediately; and,

4) I, for myself and on behalf of my heirs, assigns, personal representatives and next of kin, HEREBY RELEASE AND HOLD HARMLESS the Releasees, their officers, officials, agents, and/or employees, other participants, sponsoring agencies, sponsors, advertisers, and if applicable, owners and lessors of premises used to conduct the event ("RELEASEES"), WITH RESPECT TO ANY AND ALL INJURY, DISABILITY, DEATH, or loss or damage to person or property, WHETHER ARISING FROM THE NEGLIGENCE OF THE RELEASEES OR OTHERWISE, to the fullest extent permitted by law.`,
        
        paymentPolicy: `By signing below, I acknowledge that I have voluntarily enrolled in services provided by The Goalie Brand:
1. Payment Requirement: Full payment is required in advance to reserve any lesson, session, or clinic/event spot. All listed totals include applicable transaction and processing fees.
2. No Refund Policy: All payments are non-refundable. This includes, but is not limited to, cancellations due to illness, injury, scheduling conflicts, or weather-related issues.
3. Transfer Policy: Request must be made at least 48 hours in advance and space is available.
4. Legal Exceptions: Refunds may be considered only in extraordinary circumstances (e.g., documented medical emergencies with official physician verification).`,
        
        codeOfConduct: `I acknowledge that this Sports Training Session may carry with it the potential for death, serious injury, and personal loss. The risks may include, but are not limited to, those caused by terrain, facilities, temperature, weather, condition of participants, equipment, vehicular traffic, actions of other people including, but not limited to, participants, volunteers, spectators, coaches, and lack of hydration. I certify that I am physically fit and have not been advised NOT to participate by a qualified medical professional.`,
        
        liabilityWaiver: `I WAIVE, RELEASE, AND DISCHARGE from any and all liability, including but not limited to, liability arising from the negligence or fault of the entities or persons released, for my death, disability, personal injury, property damage, property theft, or actions of any kind. This includes THE FOLLOWING ENTITIES OR PERSONS: The Goalie Brand, Common Intellectual Creators, and/or their coaches, agents, representatives or volunteers.`
    }
};

/**
 * Resolves the access path from the entered code (case-insensitive).
 */
export function resolveAccessPath(code: string): AccessPath | null {
    if (!code) return null;
    const clean = code.trim().toUpperCase();
    if (PRIVATE_ACCESS_CONFIG.codes.founding.includes(clean)) {
        return 'founding';
    }
    if (PRIVATE_ACCESS_CONFIG.codes.newClients.includes(clean)) {
        return 'new-clients';
    }
    return null;
}
