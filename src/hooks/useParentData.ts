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
import { transformRosterToGoalie } from '@/utils/goalie-transform';
import { DEMO_IDS, DEMO_COACH_ID, DEMO_ADMIN_EMAIL } from "@/utils/demo-utils";

export function useParentData() {
    const router = useRouter();
    const auth = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [goalies, setGoalies] = useState<any[]>([]);

    const fetchMyGoalies = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);

        const emailToSearch = auth.userEmail;
        const localId = auth.localId;

        if (!emailToSearch && !localId) {
            setGoalies([]);
            setIsLoading(false);
            return;
        }

        try {
            // 1. Fetch Roster
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
                }
            }

            // Check for Role Transition
            if (rosterData && rosterData.length === 1 && auth.userRole === 'parent') {
                const g = rosterData[0];
                if (isPastSeniorSeason(g.grad_year)) {
                    if (auth.user) {
                        await supabase.from('profiles').update({ role: 'goalie' }).eq('id', auth.user.id);
                    }
                    router.push('/goalie');
                    return;
                }
            }

            const rosterIds = rosterData?.map(r => r.id) || [];

            // 2. Parallel Fetch Related Data
            const [
                allEvents,
                registeredIdsData,
                sessionsData,
                coachesData,
                refData,
                requestsDataRaw,
                creditsData
            ] = await Promise.all([
                eventsService.fetchUpcoming(),
                auth.user ? eventsService.fetchRegistrations(auth.user.id) : Promise.resolve([]),
                rosterIds.length > 0 ? sessionsService.fetchByRosterIds(rosterIds) : Promise.resolve([]),
                coachesService.fetchAllProfiles(),
                rosterIds.length > 0 ? reflectionsService.fetchByRosterIds(rosterIds) : Promise.resolve([]),
                rosterIds.length > 0 ? supabase.from('coach_requests').select('*').in('roster_id', rosterIds) : Promise.resolve({ data: [] }),
                rosterIds.length > 0 ? supabase.from('credit_transactions').select('roster_id, amount').in('roster_id', rosterIds) : Promise.resolve({ data: [] })
            ]);

            const registeredIds = new Set(registeredIdsData?.map(r => r.event_id) || []);
            const requestsData = requestsDataRaw?.data || [];
            const coachMap = new Map(coachesData?.map((c: any) => [c.id, c]) || []);

            // Pending Payment Map
            const pendingPaymentMap = new Map<string, any>();
            requestsData.forEach((req: any) => {
                if (req.status === 'approved_pending_payment') {
                    pendingPaymentMap.set(req.roster_id, req);
                }
            });

            // Sessions Map
            const sessionsMap = new Map<string, any[]>();
            sessionsData?.forEach((s: any) => {
                const list = sessionsMap.get(s.roster_id) || [];
                list.push(s);
                sessionsMap.set(s.roster_id, list);
            });

            // Reflections Map
            const reflectionsMap = new Map<string, string>();
            const reflectionsContentMap = new Map<string, string>();
            refData?.forEach((r: any) => {
                const isAthleteVoice = r.author_role === 'goalie' || r.author_role === null || r.author_role === undefined;
                if (isAthleteVoice && !reflectionsMap.has(r.roster_id)) {
                    reflectionsMap.set(r.roster_id, r.mood);
                    if (r.content) reflectionsContentMap.set(r.roster_id, r.content);
                }
            });

            // Credits Map
            const creditsMap = new Map<string, number>();
            creditsData.data?.forEach((c: any) => {
                const current = creditsMap.get(c.roster_id) || 0;
                creditsMap.set(c.roster_id, current + c.amount);
            });

            // 3. Transform Data
            const realGoalies = (rosterData || []).map(g =>
                transformRosterToGoalie(
                    g, null, allEvents, registeredIds, auth.userId,
                    coachMap, sessionsMap, reflectionsMap, reflectionsContentMap, creditsMap, pendingPaymentMap
                )
            );

            // Sort: Pro (Blues) First or other logic
            realGoalies.sort((a, b) => a.team?.includes('Blues') ? -1 : 1);
            setGoalies(realGoalies);

        } catch (error: any) {
            console.error("Error fetching parent data:", error);
            setError(error.message || "Failed to load data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMyGoalies(true);
    }, [auth.userEmail, auth.localId]);

    return { goalies, isLoading, error, fetchMyGoalies };
}
