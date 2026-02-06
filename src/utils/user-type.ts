/**
 * User type utilities
 * Determines if a goalie is Pro/Adult or Youth based on graduation year
 */

import type { Goalie } from '@/types';

export interface UserTypeInfo {
    isPro: boolean;
    isYouth: boolean;
    isAdult: boolean;
}

/**
 * Determine if a goalie is Pro/Adult or Youth
 * Logic: Anyone under 18 (Grad Year > Current Year - 1) is Youth
 */
export function getUserType(goalie: Goalie | null | undefined): UserTypeInfo {
    if (!goalie) {
        return { isPro: false, isYouth: false, isAdult: false };
    }

    const currentYear = new Date().getFullYear();
    const gradYear = goalie.grad_year || goalie.gradYear || currentYear;

    const isAdult = gradYear < currentYear;
    const isPro = isAdult;
    const isYouth = !isAdult;

    return { isPro, isYouth, isAdult };
}

/**
 * Check if a goalie is past their senior season
 */
export function isPastSeniorSeason(goalie: Goalie | null | undefined): boolean {
    if (!goalie) return false;

    const currentYear = new Date().getFullYear();
    const gradYear = goalie.grad_year || goalie.gradYear || currentYear;

    return gradYear < currentYear;
}
