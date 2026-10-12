/**
 * Maps an athlete's sport to matching exercise sports in exercise_library:
 * - 'lacrosse' exercises match lacrosse, lacrosse_mens, and lacrosse_womens.
 * - 'all' matches every sport.
 * - field_hockey and soccer use 'all' only for now.
 * - hockey matches hockey and 'all'.
 */
export function getMatchingLibrarySports(athleteSport: string): string[] {
    const s = (athleteSport || '').toLowerCase().trim();
    if (s === 'lacrosse' || s === 'lacrosse_mens' || s === 'lacrosse_womens') {
        return ['lacrosse', 'all'];
    }
    if (s === 'hockey' || s === 'ice_hockey') {
        return ['hockey', 'all'];
    }
    // field_hockey, soccer, or any other sport use 'all' only for now
    return ['all'];
}
