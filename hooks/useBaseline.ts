import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';

export interface BaselineAnswer {
    id: number;
    question: string;
    answer: string;
    mood: string;
}

export interface BaselineData {
    id: string;
    created_at: string;
    answers: BaselineAnswer[];
    raw_content: string;
}

export function useBaseline(rosterId: string | null) {
    const [data, setData] = useState<BaselineData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!rosterId) return;

        const fetchBaseline = async () => {
            setLoading(true);
            try {
                // Fetch the reflection entry tagged as 'baseline'
                const { data: reflection, error } = await supabase
                    .from('reflections')
                    .select('*')
                    .eq('roster_id', rosterId)
                    .eq('activity_type', 'baseline')
                    .order('created_at', { ascending: false }) // Get latest if multiple
                    .limit(1)
                    .single();

                if (error && error.code !== 'PGRST116') { // Ignore 'not found' error
                    throw error;
                }

                if (reflection) {
                    // Start by checking if 'raw_data' has the structured answers
                    let answers: BaselineAnswer[] = [];
                    if (reflection.raw_data && reflection.raw_data.answers) {
                        answers = reflection.raw_data.answers;
                    } else if (reflection.content) {
                        // FALLBACK: Parse from content string "Q: ... \nA: ... (Mood: ...)"
                        // This uses a regex to find Q/A pairs.
                        const chunks = reflection.content.split('Q: ');
                        answers = chunks.slice(1).map((chunk: string, i: number) => {
                            const parts = chunk.split('\nA: ');
                            if (parts.length < 2) return null;
                            const question = parts[0].trim();
                            const answerLine = parts[1].trim();
                            // Extract answer and mood
                            // "Some answer (Mood: happy)"
                            const moodMatch = answerLine.match(/\(Mood: (.*?)\)/);
                            const mood = moodMatch ? moodMatch[1] : 'neutral';
                            const answer = answerLine.replace(/\(Mood: .*?\)/, '').trim();
                            return {
                                id: i,
                                question,
                                answer,
                                mood
                            };
                        }).filter((a: any): a is BaselineAnswer => a !== null);
                    }

                    setData({
                        id: reflection.id,
                        created_at: reflection.created_at,
                        answers: answers,
                        raw_content: reflection.content
                    });
                } else {
                    setData(null);
                }

            } catch (err: any) {
                console.error("Error fetching baseline:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBaseline();
    }, [rosterId]);

    return { data, loading, error };
}
