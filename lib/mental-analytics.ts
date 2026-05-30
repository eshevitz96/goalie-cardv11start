export interface MentalSession {
    id: string;
    started_at: string;
    completed_at: string;
    template_id: string;
}

/**
 * Native helper to get the start of the day for a date.
 */
function getStartOfDay(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

/**
 * Native helper to add days to a date.
 */
function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

/**
 * Calculates the current daily streak for mental training sessions.
 * Purely native JS implementation to avoid external dependencies.
 */
export function calculateMentalStreak(sessions: MentalSession[]): number {
    if (!sessions || sessions.length === 0) return 0;

    // Filter to completed sessions and sort by date descending
    const sortedDates = sessions
        .filter(s => !!s.completed_at)
        .map(s => new Date(s.completed_at))
        .sort((a, b) => b.getTime() - a.getTime());

    if (sortedDates.length === 0) return 0;

    const uniqueDays = Array.from(new Set(sortedDates.map(d => getStartOfDay(d))));
    
    const now = new Date();
    const today = getStartOfDay(now);
    const yesterday = getStartOfDay(addDays(now, -1));

    // If latest session is not today AND not yesterday, streak is broken
    // BUT we must be careful: if they JUST finished a session, we need it to count.
    if (uniqueDays[0] < yesterday) return 0;

    let streak = 0;
    let currentRef = uniqueDays[0];

    // Check if the streak is broken relative to today
    // If the latest session was yesterday, we can still have a streak, but it won't increment until today's session is counted.
    if (uniqueDays[0] === yesterday && today !== yesterday) {
        // Streak is still alive (from yesterday), but we start counting from uniqueDays[0]
    }

    for (let i = 0; i < uniqueDays.length; i++) {
        if (i === 0) {
            streak = 1;
            continue;
        }

        const diffInDays = Math.round((uniqueDays[i-1] - uniqueDays[i]) / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 1) {
            streak++;
        } else if (diffInDays === 0) {
            // Multiple sessions same day, don't increment but don't break
            continue;
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Groups sessions into chart-friendly data based on a range.
 * Purely native JS implementation to avoid external dependencies.
 */
export function groupSessionsByRange(
    sessions: MentalSession[], 
    range: '1W' | '1M' | '3M' | '6M' | '1Y'
) {
    const now = new Date();
    let daysToLookBack = 7;

    switch (range) {
        case '1W': daysToLookBack = 7; break;
        case '1M': daysToLookBack = 30; break;
        case '3M': daysToLookBack = 90; break;
        case '6M': daysToLookBack = 180; break;
        case '1Y': daysToLookBack = 365; break;
    }

    const data: { label: string; value: number; date: Date }[] = [];

    // Calculate duration in minutes for each session
    const sessionsWithDuration = sessions
        .filter(s => !!s.completed_at)
        .map(s => ({
            date: new Date(s.completed_at),
            durationMinutes: Math.max(0, (new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 60000)
        }));

    for (let i = daysToLookBack - 1; i >= 0; i--) {
        const d = addDays(now, -i);
        const dayStart = getStartOfDay(d);
        const dayEnd = getStartOfDay(addDays(d, 1)) - 1;

        const daySessions = sessionsWithDuration.filter(s => 
            s.date.getTime() >= dayStart && s.date.getTime() <= dayEnd
        );

        const totalMinutes = daySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
        
        data.push({
            label: d.toLocaleDateString(undefined, { weekday: 'narrow', day: 'numeric' }),
            value: totalMinutes,
            date: d
        });
    }

    return data;
}
