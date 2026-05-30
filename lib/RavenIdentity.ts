/**
 * Goalie Card: Institutional Identity Engine
 * Handles the prestigious assignment of "ILL RAVEN" personas as fallback identities.
 */

const RAVEN_ASSETS = [
    'ILLRAVEN_HEADS 5.png',
    'ILLRAVEN_TOPS 2.png',
    'ILLRAVEN_TOPS 3.png',
    'ILLRAVEN_TOPS 4.png',
    'ILLRAVEN_TOPS 5.png',
    'ILLRAVEN_TOPS 10.png',
    'ILLRAVEN_TOPS 12.png',
    'ILLRAVEN_TOPS 13.png',
    'ILLRAVEN_TOPS 14.png',
    'ILLRAVEN_TOPS 18.png'
];

/**
 * Deterministically assigns a Raven identity based on a seed (e.g., user email or ID).
 * This ensures the athlete's fallback identity is permanent until they upload a photo.
 */
export function getRavenIdentity(seed: string): string {
    if (!seed) return `/ravens/${RAVEN_ASSETS[0]}`;
    
    // Simple hash function to generate a stable index
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % RAVEN_ASSETS.length;
    return `/ravens/${RAVEN_ASSETS[index]}`;
}

/**
 * Higher-order helper to determine the flagship profile image path.
 */
export function getAthleteProfileImage(email: string, avatarUrl?: string | null): string {
    if (avatarUrl) return avatarUrl;
    return getRavenIdentity(email);
}
