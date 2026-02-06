import { useState, useEffect } from 'react';
import { rosterService } from '@/services/roster';
import { highlightsService } from '@/services/highlights';
import { useAuth } from '@/hooks/useAuth';

export interface DashboardRosterItem {
    id: string;
    name: string;
    session: number;
    lesson: number;
    status: 'active' | 'pending' | 'renew_needed';
    lastSeen: string;
    assigned_coach_id: string | null;
}

export function useCoachData() {
    const { userId } = useAuth(); // We can use this to filter if we switch to server-side filtering
    const [roster, setRoster] = useState<DashboardRosterItem[]>([]);
    const [highlights, setHighlights] = useState<any[]>([]); // TODO: Type this properly
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'assigned'>('all');

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Parallel fetch
                const [rosterData, highlightsData] = await Promise.all([
                    rosterService.fetchAll(),
                    highlightsService.fetchAll()
                ]);

                if (rosterData) {
                    setRoster(rosterData.map((g: any) => ({
                        id: g.id,
                        name: g.goalie_name,
                        session: g.session_count || 1,
                        lesson: g.lesson_count || 0,
                        status: g.is_claimed ? 'active' : 'pending',
                        lastSeen: 'N/A',
                        assigned_coach_id: g.assigned_coach_id
                    })));
                }

                if (highlightsData) {
                    setHighlights(highlightsData);
                }

            } catch (error) {
                console.error("Error loading coach data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    const filteredRoster = filter === 'all' ? roster : roster.filter(r => r.assigned_coach_id);

    return {
        roster,
        highlights,
        isLoading,
        filter,
        setFilter,
        filteredRoster
    };
}
