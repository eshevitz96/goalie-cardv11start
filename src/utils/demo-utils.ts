export const DEMO_PREFIX = 'demo-';
export const DEMO_COACH_ID = 'demo-coach';
export const DEMO_ADMIN_EMAIL = 'thegoaliebrand@gmail.com';

export const DEMO_IDS = {
    PRO_1: 'demo-pro-id-001',
    PRO_2: 'demo-pro-id-002',
    LUKE_GRASSO: 'e5b8471e-72eb-4b2b-8680-ee922a43e850', // Luke's fixed ID
    LUKE_UNIQUE_ID: 'GC-8588'
};

export const DEMO_LOCAL_IDS = ['GC-PRO-01', 'GC-8001', 'GC-PRO-HKY', 'GC-DEMO-01', 'GC-PRO-LAX', 'GC-8002'];

export function isDemoId(id: string | null | undefined): boolean {
    if (!id) return false;
    return id.startsWith(DEMO_PREFIX);
}

export function isDemoUser(email: string | null | undefined): boolean {
    return email === DEMO_ADMIN_EMAIL;
}

export const DEMO_GOALIE_ID = 'demo-goalie-001';

export function getDemoGoalie(id: string) {
    if (!isDemoId(id)) return null;
    return {
        id: id,
        goalie_name: "Demo Goalie",
        email: "demo@goaliecard.com",
        role: "goalie"
    };
}

export function generateDemoId(suffix: string): string {
    return `${DEMO_PREFIX}${suffix}`;
}
