export interface GoalieData {
    id: string;
    name: string;
    team: string;
    gradYear: number;
    height: string;
    weight: string;
    catchHand: string;
    sport: string;
    coach: string;
    coachIds: string[];
    coachDetails: any;
    coachId: string;
    session: number;
    lesson: number;
    credits: number;
    activation_date: string;
    pendingPayment?: any;
    stats: {
        gaa: string;
        sv: string;
        memberSince: number;
        totalSessions: number;
        totalLessons: number;
        games?: number;
        practices?: number;
    };
    events: any[];
    feedback: any[];
    latestMood: string;
    latestContent?: string;
}

export function transformRosterToGoalie(
    g: any,
    userProfile: any,
    allEvents: any[],
    registeredIds: Set<string>,
    userId: string | null,
    coachMap: Map<string, any>,
    sessionsMap: Map<string, any[]>,
    reflectionsMap: Map<string, string>,
    reflectionsContentMap: Map<string, string>,
    creditsMap: Map<string, number>,
    pendingPaymentMap: Map<string, any> = new Map()
): GoalieData {
    // 1. Filter Events
    const goalieSports = g.sport ? g.sport.split(',').map((s: string) => s.trim()) : [];
    const goalieEvents = allEvents
        ?.filter(e => {
            // Sport Match
            if (e.sport && goalieSports.length > 0 && !goalieSports.includes(e.sport)) {
                return false;
            }
            // Registered Match (Strict for Card)
            return registeredIds.has(e.id);
        })
        .map(e => ({
            id: e.id,
            name: e.name,
            date: new Date(e.date).toLocaleDateString(),
            location: e.location || 'TBA',
            status: "upcoming" as const,
            image: e.image || "from-gray-500 to-gray-600",
            price: e.price,
            sport: e.sport,
            rawDate: new Date(e.date)
        })) || [];

    // 2. Resolve Coach
    let assignedCoachName = "Assigned Coach";
    let assignedCoachIds: string[] = [];
    let primaryCoachDetails = null;

    if (g.assigned_coach_ids && g.assigned_coach_ids.length > 0) {
        assignedCoachIds = g.assigned_coach_ids;
        const coaches = assignedCoachIds.map(id => coachMap.get(id));
        const names = coaches.map(c => c?.goalie_name || "Unknown");
        assignedCoachName = names.length === 1 ? names[0] : `${names.length} Coaches`;
        primaryCoachDetails = coaches[0] || null;
    } else if (g.assigned_coach_id) {
        const coach: any = coachMap.get(g.assigned_coach_id);
        assignedCoachName = coach?.goalie_name || "Unknown Coach";
        primaryCoachDetails = coach || null;
    }

    // 3. Map Sessions
    const gSessions = sessionsMap.get(g.id) || [];
    const feedbackItems = gSessions.map(s => ({
        id: s.id,
        date: new Date(s.date).toLocaleDateString(),
        coach: assignedCoachName,
        title: `Session ${s.session_number} • Lesson ${s.lesson_number}`,
        content: s.notes || "No notes for this session.",
        rating: 5,
        hasVideo: false
    }));

    // 4. Volume logic (from useParentData)
    const pastEventsCount = goalieEvents.filter(e => e.rawDate < new Date()).length;
    const totalActivityCount = (Number(g.session_count) || 0) + (gSessions.length) + pastEventsCount;

    // Derive counts as the max of static DB columns vs actual logged sessions
    const derivedSessionCount = Math.max(Number(g.session_count) || 0, gSessions.length);
    const derivedLessonCount = Math.max(
        Number(g.lesson_count) || 0,
        gSessions.reduce((max: number, s: any) => Math.max(max, Number(s.lesson_number) || 0), 0)
    );

    return {
        id: g.id,
        name: g.goalie_name && g.goalie_name !== g.team ? g.goalie_name : (userProfile?.goalie_name || g.goalie_name || 'Unknown Goalie'),
        team: g.team || 'Unattached',
        gradYear: g.grad_year || userProfile?.grad_year || 0,
        height: g.height,
        weight: g.weight,
        catchHand: g.catch_hand,
        sport: g.sport || 'Hockey',
        coach: assignedCoachName,
        coachIds: assignedCoachIds,
        coachDetails: primaryCoachDetails,
        coachId: g.assigned_coach_id,
        session: derivedSessionCount,
        lesson: derivedLessonCount,
        credits: creditsMap.get(g.id) || 0,
        activation_date: g.activation_date || g.created_at,
        pendingPayment: pendingPaymentMap.get(g.id) || null,
        stats: {
            gaa: "0.00",
            sv: ".000",
            memberSince: gSessions.length > 0 ? new Date(gSessions[gSessions.length - 1].date).getFullYear() : new Date().getFullYear(),
            totalSessions: totalActivityCount,
            totalLessons: derivedLessonCount,
            games: g.games_count || 0,
            practices: g.practice_count || 0
        },
        events: goalieEvents,
        feedback: feedbackItems,
        latestMood: reflectionsMap.get(g.id) || 'neutral',
        latestContent: reflectionsContentMap.get(g.id) || ""
    };
}
