import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/utils/supabase/client';

interface SquadMember {
    id: string;
    athlete_name: string;
}

export function useSquadIntel(members: SquadMember[]) {
    const [allShots, setAllShots] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedGoalieIds, setSelectedGoalieIds] = useState<string[]>([]);

    const fetchSquadShots = async () => {
        if (members.length === 0) {
            setAllShots([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const ids = members.map(m => m.id);
            const { data, error } = await supabase
                .from('shot_events')
                .select('*')
                .in('roster_id', ids);
            
            if (error) throw error;
            setAllShots(data || []);
        } catch (err) {
            console.error("Squad Intel Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSquadShots();
    }, [members]);

    const toggleGoalie = (id: string | null) => {
        if (id === null) {
            setSelectedGoalieIds([]);
            return;
        }
        setSelectedGoalieIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Performant Derived State using useMemo
    const squadData = useMemo(() => {
        const filteredShots = selectedGoalieIds.length > 0
            ? allShots.filter(s => selectedGoalieIds.includes(s.roster_id))
            : allShots;

        const getStats = (items: any[]) => {
            const saves = items.filter(s => s.result === 'save').length;
            const goals = items.filter(s => s.result === 'goal').length;
            const total = items.length;
            const savePct = total > 0 ? (saves / total) * 100 : 0;
            return { saves, goals, total, savePct };
        };

        // Comparison Stats for individual goalies if selected
        const compareStats = selectedGoalieIds.map(id => ({
            id,
            name: members.find(m => m.id === id)?.athlete_name || 'Goalie',
            shots: allShots.filter(s => s.roster_id === id),
            stats: getStats(allShots.filter(s => s.roster_id === id))
        }));

        return {
            shots: filteredShots,
            stats: getStats(filteredShots),
            compareStats
        };
    }, [allShots, selectedGoalieIds, members]);

    return {
        ...squadData,
        isLoading,
        selectedGoalieIds,
        toggleGoalie,
        refresh: fetchSquadShots
    };
}
