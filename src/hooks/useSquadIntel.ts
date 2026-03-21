import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/utils/supabase/client';

interface SquadMember {
    id: string;
    athlete_name: string;
}

export function useSquadIntel(members: SquadMember[]) {
    const [allShots, setAllShots] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedGoalieId, setSelectedGoalieId] = useState<string | null>(null);

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

    // Performant Derived State using useMemo
    const squadData = useMemo(() => {
        const filteredShots = selectedGoalieId 
            ? allShots.filter(s => s.roster_id === selectedGoalieId)
            : allShots;

        const saves = filteredShots.filter(s => s.result === 'save').length;
        const goals = filteredShots.filter(s => s.result === 'goal').length;
        const total = filteredShots.length;
        const savePct = total > 0 ? (saves / total) * 100 : 0;

        return {
            shots: filteredShots,
            stats: {
                saves,
                goals,
                total,
                savePct
            }
        };
    }, [allShots, selectedGoalieId]);

    return {
        ...squadData,
        isLoading,
        selectedGoalieId,
        setSelectedGoalieId,
        refresh: fetchSquadShots
    };
}
