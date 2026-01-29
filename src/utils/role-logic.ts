
export const SCHOOL_YEAR_END_MONTH = 6; // July 1st (0-indexed month 6 is July)

/**
 * Determines if the goalie has passed their Senior High School season.
 * This is defined as being after July 1st of their graduation year.
 */
export function isPastSeniorSeason(gradYear: number | string): boolean {
    if (!gradYear) return false;

    const yearInt = typeof gradYear === 'string' ? parseInt(gradYear) : gradYear;
    if (isNaN(yearInt)) return false;

    const now = new Date();
    // Transition happens July 1st of Grad Year
    const transitionDate = new Date(yearInt, 6, 1);

    return now > transitionDate;
}

/**
 * Determines the primary role for the user explicitly based on the 
 * "Dynamic Relationship" logic:
 * - Transition to Goalie Portal happens at the end of Senior HS Season.
 * - Otherwise/Fallback checks legal age (18).
 */
export function determineUserRole(birthDateInput: string | Date, gradYear?: number | string): 'goalie' | 'parent' {
    // 1. Priority: Academic/Season Timeline
    if (gradYear) {
        if (isPastSeniorSeason(gradYear)) {
            return 'goalie';
        }
        // If not past senior season, we fall through to Age check? 
        // Or does "Transition at end of season" imply "Parent BEFORE that"?
        // The user says "transition ... should happen ... at the end of their senior high school season."
        // This implies that prior to this, they are NOT in the goalie portal (so 'parent').
        // However, we must respect legal age > 18 for waivers usually. 
        // But for "Portal Access", the User wants the "College Treatment" trigger to be the season end.
    }

    // 2. Fallback: Legal Age (if grad year missing, or as safety)
    // Note: If they provided Grad Year, the logic above dominates for the "Transition".
    // But if someone is 19 but 'grad_year' says they graduate next year (super senior?), 
    // maybe we stick to Grad Year?
    // Let's assume Grad Year is the primary driver for "Goalie Portal" logic as requested.

    if (gradYear && !isPastSeniorSeason(gradYear)) {
        return 'parent';
    }

    const birthDate = new Date(birthDateInput);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age >= 18 ? 'goalie' : 'parent';
}
