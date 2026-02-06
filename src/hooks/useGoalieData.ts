import { useState, useEffect } from 'react';
import { supabase } from "@/utils/supabase/client";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/context/ToastContext";
import { DEMO_IDS, DEMO_COACH_ID, DEMO_ADMIN_EMAIL } from "@/utils/demo-utils";

export function useGoalieData() {
    const { userId, userEmail, localId, loading: authLoading } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [goalies, setGoalies] = useState<any[]>([]);

    const fetchMyGoalies = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);

        // 1. Auth Check - Wait for auth to be ready if it's still loading initially
        if (authLoading && !userEmail && !localId) {
            // Let internal auth hook finish
            return;
        }

        const emailToSearch = userEmail;

        if (!emailToSearch && !localId) {
            setGoalies([]);
            setIsLoading(false);
            return;
        }

        // 2. Query Roster
        let query = supabase.from('roster_uploads').select('*');

        if (emailToSearch) {
            query = query.ilike('email', emailToSearch);
        } else if (localId) {
            query = query.eq('assigned_unique_id', localId);
        } else {
            setGoalies([]);
            setIsLoading(false);
            return;
        }

        let { data: rosterData, error: rosterError } = await query;
        if (rosterError) console.error("Roster Fetch Error:", rosterError);

        // DEMO & LOCAL OVERRIDE LOGIC
        // Bridge for Luke Grasso (Live Activation Test)
        if ((!rosterData || rosterData.length === 0) && (localId === DEMO_IDS.LUKE_UNIQUE_ID || emailToSearch === DEMO_ADMIN_EMAIL)) {
            rosterData = [{
                id: DEMO_IDS.LUKE_GRASSO,
                goalie_name: 'Luke Grasso',
                team: 'Yale Bulldogs',
                grad_year: 2029,
                height: '6-0',
                weight: '190',
                catch_hand: 'Left',
                sport: 'Lacrosse',
                assigned_unique_id: DEMO_IDS.LUKE_UNIQUE_ID,
                email: 'lukegrasso09@gmail.com',
                parent_name: 'Parent Grasso',
                session_count: 20,
                lesson_count: 1,
                games_count: 5,
                practice_count: 10,
                assigned_coach_id: DEMO_COACH_ID,
                assigned_coach_ids: [DEMO_COACH_ID]
            }];
        }

        // 3. Fetch Events
        const { data: allEvents } = await supabase.from('events').select('*').gte('date', new Date().toISOString()).order('date', { ascending: true });

        // 4. Fetch Registrations
        let registeredIds = new Set();
        if (userId) {
            const { data: regs } = await supabase.from('registrations').select('event_id').eq('goalie_id', userId);
            registeredIds = new Set(regs?.map(r => r.event_id) || []);
        }

        // 5. Fetch Session History
        let sessionsMap = new Map<string, any[]>();
        if (rosterData && rosterData.length > 0) {
            const rosterIds = rosterData.map(r => r.id);
            const { data: sessionsData } = await supabase
                .from('sessions')
                .select('*')
                .in('roster_id', rosterIds)
                .order('date', { ascending: false });

            if (sessionsData) {
                sessionsData.forEach(s => {
                    const list = sessionsMap.get(s.roster_id) || [];
                    list.push(s);
                    sessionsMap.set(s.roster_id, list);
                });
            }
        }

        // 6. Fetch Coaches
        const { data: coachesData } = await supabase.from('profiles').select('id, goalie_name, training_types, pricing_config, development_philosophy').eq('role', 'coach');
        const coachMap = new Map(coachesData?.map(c => [c.id, c]) || []);

        // 7.1 Fetch Latest Reflections
        let reflectionsMap = new Map<string, string>();
        if (rosterData && rosterData.length > 0) {
            const rosterIds = rosterData.map(r => r.id);
            const { data: refData } = await supabase
                .from('reflections')
                .select('roster_id, mood, created_at, author_role')
                .in('roster_id', rosterIds)
                .order('created_at', { ascending: false });

            if (refData) {
                refData.forEach(r => {
                    const isAthleteVoice = r.author_role === 'goalie' || r.author_role === null || r.author_role === undefined;
                    if (isAthleteVoice && !reflectionsMap.has(r.roster_id)) {
                        reflectionsMap.set(r.roster_id, r.mood);
                    }
                });
            }
        }

        // 7. Process & Map Data
        if (rosterData && rosterData.length > 0) {
            const realGoalies = rosterData.map(g => {
                // Filter Events
                const goalieSports = g.sport ? g.sport.split(',').map((s: string) => s.trim()) : [];
                const goalieEvents = allEvents
                    ?.filter(e => {
                        if (!e.sport) return true;
                        if (goalieSports.length === 0) return true;
                        return goalieSports.includes(e.sport);
                    })
                    .map(e => ({
                        id: e.id,
                        name: e.name,
                        date: new Date(e.date).toLocaleDateString(),
                        location: e.location || 'TBA',
                        status: registeredIds.has(e.id) ? "upcoming" : "open",
                        image: e.image || "from-gray-500 to-gray-600",
                        price: e.price,
                        sport: e.sport,
                        rawDate: e.date
                    })) || [];

                // Resolve Coach
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

                // Map Sessions
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

                return {
                    id: g.id,
                    name: g.goalie_name,
                    team: g.team,
                    gradYear: g.grad_year,
                    height: g.height,
                    weight: g.weight,
                    catchHand: g.catch_hand,
                    sport: g.sport || 'Hockey',
                    coach: assignedCoachName,
                    coachIds: assignedCoachIds,
                    coachDetails: primaryCoachDetails,
                    coachId: g.assigned_coach_id,
                    session: g.session_count || 0,
                    lesson: g.lesson_count || 0,
                    stats: {
                        gaa: "0.00",
                        sv: ".000",
                        memberSince: gSessions.length > 0 ? new Date(gSessions[gSessions.length - 1].date).getFullYear() : new Date().getFullYear(),
                        totalSessions: g.session_count || 0,
                        totalLessons: g.lesson_count || 0
                    },
                    events: goalieEvents,
                    feedback: feedbackItems,
                    latestMood: reflectionsMap.get(g.id) || 'neutral'
                };
            });
            setGoalies(realGoalies);
        } else {
            setGoalies([]);
        }
        setIsLoading(false);
    };

    // Initial Fetch
    useEffect(() => {
        if (!authLoading) {
            fetchMyGoalies(true);
        }
    }, [userEmail, localId, authLoading]);

    return {
        goalies,
        isLoading,
        fetchMyGoalies
    };
}
