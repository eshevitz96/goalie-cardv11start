import { useState, useEffect } from 'react';
import { supabase } from "@/utils/supabase/client";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from "next/navigation";
import { rosterService } from '@/services/roster';
import { eventsService } from '@/services/events';
import { sessionsService } from '@/services/sessions';
import { coachesService } from '@/services/coaches';
import { reflectionsService } from '@/services/reflections';
import { isPastSeniorSeason } from "@/utils/role-logic";
import { DEMO_IDS, DEMO_COACH_ID, DEMO_ADMIN_EMAIL } from "@/utils/demo-utils";

export function useParentData() {
    const router = useRouter();
    const auth = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [goalies, setGoalies] = useState<any[]>([]);

    const fetchMyGoalies = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);

        // Use centralized auth
        let emailToSearch = auth.userEmail;
        const localId = auth.localId;

        if (!emailToSearch && !localId) {
            setGoalies([]);
            setIsLoading(false);
            return;
        }

        try {
            // 1. Query Roster
            let rosterData = await rosterService.fetchByEmailOrId(emailToSearch, localId);

            // DEMO FALLBACK
            if ((!rosterData || rosterData.length === 0) && localId) {
                if (['GC-PRO-01', 'GC-8001', 'GC-PRO-HKY', 'GC-DEMO-01'].includes(localId)) {
                    rosterData = [{
                        id: DEMO_IDS.PRO_1,
                        goalie_name: 'Elliott Shevitz',
                        team: 'Arizona Coyotes',
                        grad_year: 2024,
                        height: '6-2',
                        weight: '205',
                        catch_hand: 'Left',
                        sport: 'Hockey',
                        assigned_unique_id: localId,
                        email: DEMO_ADMIN_EMAIL,
                        parent_name: 'David Shevitz',
                        session_count: 0,
                        lesson_count: 0,
                        games_count: 24,
                        practice_count: 112,
                        assigned_coach_id: DEMO_COACH_ID,
                        assigned_coach_ids: [DEMO_COACH_ID]
                    }];
                } else if (['GC-PRO-LAX', 'GC-8002'].includes(localId)) {
                    rosterData = [{
                        id: DEMO_IDS.PRO_2,
                        goalie_name: 'Luke Grasso',
                        team: 'Yale Bulldogs',
                        grad_year: 2025,
                        height: '6-0',
                        weight: '190',
                        catch_hand: 'Left',
                        sport: 'Lacrosse',
                        assigned_unique_id: localId,
                        email: 'luke.grasso@example.com',
                        parent_name: 'Parent Grasso',
                        session_count: 45,
                        lesson_count: 12,
                        assigned_coach_id: DEMO_COACH_ID,
                        assigned_coach_ids: [DEMO_COACH_ID]
                    }];
                } else if (localId === DEMO_IDS.LUKE_UNIQUE_ID || auth.userEmail === DEMO_ADMIN_EMAIL) {
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
            }

            // DEMO OVERRIDE: Check LocalStorage
            if (typeof window !== 'undefined') {
                const override = localStorage.getItem('demo_profile_override');
                if (override && rosterData && rosterData.length > 0) {
                    try {
                        const updates = JSON.parse(override);
                        if (rosterData[0].assigned_unique_id === localId || rosterData[0].assigned_unique_id?.startsWith('GC-')) {
                            rosterData[0] = { ...rosterData[0], ...updates };
                        }
                    } catch (e) { console.error("Error applying local override", e); }
                }
            }

            // Check for Role Transition
            if (rosterData && rosterData.length === 1 && auth.userRole === 'parent') {
                const g = rosterData[0];
                if (isPastSeniorSeason(g.grad_year)) {
                    console.log("Goalie has graduated. Transitioning to Goalie Portal...");
                    if (auth.user) {
                        await supabase.from('profiles').update({ role: 'goalie' }).eq('id', auth.user.id);
                    }
                    router.push('/goalie');
                    return;
                }
            }

            // Fetch Related Data in Parallel
            const [allEvents, registeredIdsData, sessionsData, coachesData, refData] = await Promise.all([
                eventsService.fetchUpcoming(),
                auth.user ? eventsService.fetchRegistrations(auth.user.id) : Promise.resolve([]),
                (rosterData && rosterData.length > 0) ? sessionsService.fetchByRosterIds(rosterData.map(r => r.id)) : Promise.resolve([]),
                coachesService.fetchAllProfiles(),
                (rosterData && rosterData.length > 0) ? reflectionsService.fetchByRosterIds(rosterData.map(r => r.id)) : Promise.resolve([])
            ]);

            const registeredIds = new Set(registeredIdsData?.map(r => r.event_id) || []);

            // Map Sessions
            let sessionsMap = new Map<string, any[]>();
            if (sessionsData) {
                sessionsData.forEach((s: any) => {
                    const list = sessionsMap.get(s.roster_id) || [];
                    list.push(s);
                    sessionsMap.set(s.roster_id, list);
                });
            }

            // Map Coaches
            const coachMap = new Map(coachesData?.map((c: any) => [c.id, c]) || []);

            // Map Reflections
            let reflectionsMap = new Map<string, string>();
            let reflectionsContentMap = new Map<string, string>();

            // DEMO Reflections
            if (typeof window !== 'undefined') {
                const demoMood = localStorage.getItem('demo_latest_mood');
                const demoContent = localStorage.getItem('demo_latest_content');
                [DEMO_IDS.PRO_1, DEMO_IDS.PRO_2].forEach(id => {
                    if (demoMood) reflectionsMap.set(id, demoMood);
                    if (demoContent) reflectionsContentMap.set(id, demoContent);
                });
            }

            if (refData) {
                refData.forEach((r: any) => {
                    const isAthleteVoice = r.author_role === 'goalie' || r.author_role === null || r.author_role === undefined;
                    if (isAthleteVoice && !reflectionsMap.has(r.roster_id)) {
                        reflectionsMap.set(r.roster_id, r.mood);
                        if (r.content) reflectionsContentMap.set(r.roster_id, r.content);
                    }
                });
            }

            // JOIN EVERYTHING
            if (rosterData && rosterData.length > 0) {
                const realGoalies = rosterData.map(g => {
                    // Filter Events
                    const goalieSports = g.sport ? g.sport.split(',').map((s: string) => s.trim()) : [];
                    const goalieEvents = allEvents
                        ?.filter((e: any) => {
                            if (!e.sport) return true;
                            if (goalieSports.length === 0) return true;
                            return goalieSports.includes(e.sport);
                        })
                        .map((e: any) => ({
                            id: e.id,
                            name: e.name,
                            date: new Date(e.date).toLocaleDateString(),
                            location: e.location || 'TBA',
                            status: registeredIds.has(e.id) ? "upcoming" : "open",
                            image: e.image || "from-gray-500 to-gray-600",
                            price: e.price,
                            sport: e.sport,
                            rawDate: new Date(e.date)
                        }))
                        .filter((e: any) => e.status === 'upcoming') || [];

                    // Activity Volume
                    const myReflections = refData?.filter((r: any) => r.roster_id === g.id && (r.author_role === 'goalie' || r.author_role === null)) || [];
                    const reflectionCount = myReflections.length;
                    const pastEventsCount = goalieEvents.filter((e: any) => e.rawDate < new Date()).length;

                    // Resolve Coach
                    let assignedCoachName = "Assigned Coach";
                    let assignedCoachIds: string[] = [];
                    let primaryCoachDetails = null;

                    if (g.assigned_coach_ids && g.assigned_coach_ids.length > 0) {
                        assignedCoachIds = g.assigned_coach_ids;
                        const coaches = assignedCoachIds.map(id => coachMap.get(id));
                        const names = coaches.map((c: any) => c?.goalie_name || "Unknown");
                        assignedCoachName = names.length === 1 ? names[0] : `${names.length} Coaches`;
                        primaryCoachDetails = coaches[0] || null;
                    } else if (g.assigned_coach_id) {
                        const coach: any = coachMap.get(g.assigned_coach_id);
                        assignedCoachName = coach?.goalie_name || "Unknown Coach";
                        primaryCoachDetails = coach || null;
                    }

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

                    const totalActivityCount = (Number(g.session_count) || 0) + reflectionCount + pastEventsCount;

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
                        session: Number(g.session_count) || 0,
                        lesson: Number(g.lesson_count) || 0,
                        stats: {
                            gaa: "0.00",
                            sv: ".000",
                            memberSince: g.id === DEMO_IDS.PRO_1 ? 2018 : (gSessions.length > 0 ? new Date(gSessions[gSessions.length - 1].date).getFullYear() : new Date().getFullYear()),
                            totalSessions: totalActivityCount,
                            totalLessons: Number(g.lesson_count) || 0,
                            games: g.games_count || 0,
                            practices: g.practice_count || 0
                        },
                        events: goalieEvents,
                        feedback: feedbackItems,
                        latestMood: reflectionsMap.get(g.id) || 'neutral',
                        latestContent: reflectionsContentMap.get(g.id) || ""
                    };
                });

                // Sort: Pro (Blues) First
                realGoalies.sort((a, b) => a.team?.includes('Blues') ? -1 : 1);
                setGoalies(realGoalies);
            } else {
                setGoalies([]);
            }

        } catch (error) {
            console.error("Error fetching parent data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMyGoalies(true);
        const handleDemoUpdate = () => fetchMyGoalies(false);
        window.addEventListener('demo_reflection_updated', handleDemoUpdate);
        return () => window.removeEventListener('demo_reflection_updated', handleDemoUpdate);
    }, [auth.userEmail, auth.localId]); // Re-fetch when auth changes

    return {
        goalies,
        isLoading,
        fetchMyGoalies
    };
}
