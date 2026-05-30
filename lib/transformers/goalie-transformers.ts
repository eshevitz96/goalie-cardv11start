
/**
 * Goalie Data Transformers
 * 
 * These functions act as a "Selector" layer between the raw data hooks and the UI components.
 * They ensure that the UI receives clean, consistent, and formatted data regardless of the backend source.
 */

// Format basic profile information
export function transformGoalieProfile(goalie: any) {
    if (!goalie) return null;

    return {
        id: goalie.id,
        name: goalie.name || 'Unknown Goalie',
        team: goalie.team || 'Unattached',
        gradYear: goalie.gradYear,
        height: goalie.height,
        weight: goalie.weight,
        catchHand: goalie.catchHand,
        sport: goalie.sport || 'Hockey',
        // Coach info
        coach: goalie.coach || 'Assigned Coach',
        coachIds: goalie.coachIds || [],
        coachDetails: goalie.coachDetails,
        coachId: goalie.coachId,
        // Training progress
        session: goalie.session || 0,
        lesson: goalie.lesson || 0,
    };
}

// Sort and filter events
export function transformGoalieEvents(events: any[]) {
    if (!events || !Array.isArray(events)) return [];

    // Prioritize 'Registered' events, then by Date
    return events.sort((a: any, b: any) => {
        if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
        if (a.status !== 'upcoming' && b.status === 'upcoming') return 1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
}

// Format stats for display
export function transformGoalieStats(goalie: any) {
    if (!goalie || !goalie.stats) {
        return {
            gaa: "0.00",
            sv: ".000",
            memberSince: new Date().getFullYear(),
            totalSessions: 0,
            totalLessons: 0,
            games: 0,
            practices: 0
        };
    }

    return {
        gaa: goalie.stats.gaa || "0.00",
        sv: goalie.stats.sv || ".000",
        memberSince: goalie.stats.memberSince || new Date().getFullYear(),
        totalSessions: goalie.stats.totalSessions || 0,
        totalLessons: goalie.stats.totalLessons || 0,
        games: goalie.stats.games || 0,
        practices: goalie.stats.practices || 0
    };
}

// Full Goalie Object Transformer
// Use this to sanitize the entire object before passing to Dashboard
export function transformGoalieData(goalie: any) {
    if (!goalie) return null;

    const profile = transformGoalieProfile(goalie);
    const events = transformGoalieEvents(goalie.events);
    const stats = transformGoalieStats(goalie);

    return {
        ...profile,
        events,
        stats,
        // Pass-through other necessary fields
        email: goalie.email || goalie.settings?.email || '',
        credits: goalie.credits || 0,
        feedback: goalie.feedback || [],
        latestMood: goalie.latestMood || 'neutral',
        latestContent: goalie.latestContent || ""
    };
}
