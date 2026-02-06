/**
 * Demo mode utilities
 * Centralizes all demo user detection and data injection logic
 */

import type { Goalie } from '@/types';

/**
 * Demo user IDs that should receive simulated data
 */
export const DEMO_USER_IDS = [
    'GC-PRO-01',
    'GC-8001',
    'GC-PRO-HKY',
    'GC-DEMO-01',
    'GC-8588',
] as const;

/**
 * Check if a given ID is a demo user
 */
export function isDemoUser(id: string | null): boolean {
    if (!id) return false;
    return DEMO_USER_IDS.includes(id as any) || id.startsWith('GC-');
}

/**
 * Check if demo mode is enabled in localStorage
 */
export function isDemoModeEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('demo_mode') === 'true';
}

/**
 * Get demo user data based on ID
 */
export function getDemoUserData(localId: string): Goalie | null {
    // Elliott Shevitz (Hockey Pro Test)
    if (['GC-PRO-01', 'GC-8001', 'GC-PRO-HKY', 'GC-DEMO-01'].includes(localId)) {
        return {
            id: 'demo-pro-hockey',
            goalie_name: 'Elliott Shevitz',
            email: 'thegoaliebrand@gmail.com',
            team: 'Demo Pro Team',
            grad_year: 2020,
            height: '6\'2"',
            weight: '185',
            catch_hand: 'Left',
            sport: 'Hockey',
            assigned_unique_id: localId,
            is_claimed: true,
            session_count: 0,
            lesson_count: 0,
        };
    }

    // Luke Grasso (Live Activation Test)
    if (localId === 'GC-8588') {
        return {
            id: 'e5b8471e-72eb-4b2b-8680-ee922a43e850',
            goalie_name: 'Luke Grasso',
            team: 'Yale Bulldogs',
            grad_year: 2029,
            height: '6\'1"',
            weight: '175',
            catch_hand: 'Left',
            sport: 'Hockey',
            email: 'thegoaliebrand@gmail.com',
            assigned_unique_id: localId,
            is_claimed: true,
            session_count: 2,
            lesson_count: 1,
        };
    }

    return null;
}

/**
 * Get demo email override for a given local ID
 */
export function getDemoEmailOverride(localId: string | null): string | null {
    if (!localId) return null;
    if (localId.startsWith('GC-')) {
        return 'thegoaliebrand@gmail.com';
    }
    return null;
}
