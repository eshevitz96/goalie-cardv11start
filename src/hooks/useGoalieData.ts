import { useState, useEffect } from 'react';
import { supabase } from "@/utils/supabase/client";
import { useAuth } from '@/hooks/useAuth';
import { rosterService } from '@/services/roster';
import { eventsService } from '@/services/events';
import { sessionsService } from '@/services/sessions';
import { coachesService } from '@/services/coaches';
import { reflectionsService } from '@/services/reflections';
import { transformRosterToGoalie } from '@/utils/goalie-transform';
import { DEMO_IDS, DEMO_COACH_ID, DEMO_ADMIN_EMAIL } from "@/utils/demo-utils";

export function useGoalieData() {
    const { userId, userEmail, localId, loading: authLoading } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [goalies, setGoalies] = useState<any[]>([]);

    const fetchMyGoalies = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);

        if (authLoading && !userEmail && !localId) return;

        const emailToSearch = userEmail;
        if (!emailToSearch && !localId) {
            setGoalies([]);
            setIsLoading(false);
            return;
        }

        try {
            // 1. Fetch Roster
            let rosterData = await rosterService.fetchByEmailOrId(emailToSearch, localId);

            // DEMO FALLBACK
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
                    lesson_count: 78,
                    games_count: 5,
                    practice_count: 10,
                    assigned_coach_id: DEMO_COACH_ID,
                    assigned_coach_ids: [DEMO_COACH_ID]
                }];
            }

            const rosterIds = rosterData?.map(r => r.id) || [];

            // 2. Parallel Fetch All Related Data
            const [
                allEvents,
                registrations,
                sessionsData,
                coachesData,
                refData,
                userProfileData,
                creditsData
            ] = await Promise.all([
                eventsService.fetchUpcoming(),
                userId ? eventsService.fetchRegistrations(userId) : Promise.resolve([]),
                rosterIds.length > 0 ? sessionsService.fetchByRosterIds(rosterIds) : Promise.resolve([]),
                coachesService.fetchAllProfiles(),
                rosterIds.length > 0 ? reflectionsService.fetchByRosterIds(rosterIds) : Promise.resolve([]),
                userId ? supabase.from('profiles').select('*').eq('id', userId).single() : Promise.resolve({ data: null }),
                rosterIds.length > 0 ? supabase.from('credit_transactions').select('roster_id, amount').in('roster_id', rosterIds) : Promise.resolve({ data: [] })
            ]);

            const registeredIds = new Set(registrations?.map(r => r.event_id) || []);
            const userProfile = userProfileData.data;
            const coachMap = new Map(coachesData?.map((c: any) => [c.id, c]) || []);

            // Map Sessions
            const sessionsMap = new Map<string, any[]>();
            sessionsData?.forEach((s: any) => {
                const list = sessionsMap.get(s.roster_id) || [];
                list.push(s);
                sessionsMap.set(s.roster_id, list);
            });

            // Map Reflections
            const reflectionsMap = new Map<string, string>();
            const reflectionsContentMap = new Map<string, string>();
            refData?.forEach((r: any) => {
                const isAthleteVoice = r.author_role === 'goalie' || r.author_role === null || r.author_role === undefined;
                if (isAthleteVoice && !reflectionsMap.has(r.roster_id)) {
                    reflectionsMap.set(r.roster_id, r.mood);
                    if (r.content) reflectionsContentMap.set(r.roster_id, r.content);
                }
            });

            // Map Credits
            const creditsMap = new Map<string, number>();
            creditsData.data?.forEach((c: any) => {
                const current = creditsMap.get(c.roster_id) || 0;
                creditsMap.set(c.roster_id, current + c.amount);
            });

            // 3. Transform Data
            const realGoalies = (rosterData || []).map(g =>
                transformRosterToGoalie(
                    g, userProfile, allEvents, registeredIds, userId,
                    coachMap, sessionsMap, reflectionsMap, reflectionsContentMap, creditsMap
                )
            );

            // 4. Sort
            const sortedGoalies = realGoalies.sort((a, b) => {
                const aHasName = a.name !== 'Unknown Goalie' ? 1 : 0;
                const bHasName = b.name !== 'Unknown Goalie' ? 1 : 0;
                if (aHasName !== bHasName) return bHasName - aHasName;

                const aDate = new Date(a.activation_date || 0).getTime();
                const bDate = new Date(b.activation_date || 0).getTime();
                return bDate - aDate;
            });

            setGoalies(sortedGoalies);
        } catch (err) {
            console.error("Fetch Error in useGoalieData:", err);
            setGoalies([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) fetchMyGoalies(true);
    }, [userEmail, localId, authLoading]);

    return { goalies, isLoading, fetchMyGoalies };
}
