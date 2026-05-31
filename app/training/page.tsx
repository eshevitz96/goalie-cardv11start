'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import RavenGame from '@/components/training/RavenGame';

export default function TrainingPage() {
    const auth = useAuth();
    const router = useRouter();

    const isDevBypass = process.env.NEXT_PUBLIC_DEV_BYPASS === 'true';
    const activeUserId = isDevBypass ? "00000000-0000-0000-0000-000000000000" : auth.userId;
    const activeIsAuthenticated = isDevBypass ? true : auth.isAuthenticated;
    const activeAuthLoading = isDevBypass ? false : auth.loading;

    const [loading, setLoading] = useState(true);
    const [personalBest, setPersonalBest] = useState<number | null>(null);

    // Client-side authentication protection redirect
    useEffect(() => {
        if (!activeAuthLoading && !activeIsAuthenticated) {
            router.push('/login');
        }
    }, [activeAuthLoading, activeIsAuthenticated, router]);

    // Fetch personal best score on page load (game_type = 'training')
    useEffect(() => {
        if (!activeUserId) return;

        const fetchPersonalBest = async () => {
            setLoading(true);
            try {
                const uid = activeUserId;

                if (uid === '00000000-0000-0000-0000-000000000000') {
                    // Dev bypass mode
                    const localPb = localStorage.getItem('dev_training_pb');
                    setPersonalBest(localPb ? parseInt(localPb, 10) : null);
                } else {
                    // Fetch real PB from Supabase
                    const { data, error } = await supabase
                        .from('training_game_scores')
                        .select('score')
                        .eq('user_id', uid)
                        .eq('game_type', 'training')
                        .order('score', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (!error && data) {
                        setPersonalBest(data.score);
                    }
                }
            } catch (err) {
                console.error('Error loading training personal best:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPersonalBest();
    }, [activeUserId]);

    // Show loading spinner while loading session or user state
    if (activeAuthLoading || (loading && activeUserId)) {
        return (
            <div 
                className="flex items-center justify-center text-foreground w-full"
                style={{ minHeight: '100vh', background: '#09090B' }}
            >
                <Loader2 className="animate-spin text-white/30" size={32} />
            </div>
        );
    }

    // Secure fallback block
    if (!activeIsAuthenticated) {
        return null;
    }

    return (
        <div 
            className="text-foreground font-sans flex flex-col justify-start w-full"
            style={{ 
                minHeight: '100vh', 
                background: '#09090B', 
                paddingTop: '24px', 
                paddingBottom: '80px', 
                paddingLeft: '16px', 
                paddingRight: '16px' 
            }}
        >
            <div className="max-w-[480px] mx-auto w-full">
                
                {/* Back Navigation */}
                <Link href="/dashboard" className="flex items-center gap-2 mb-6 opacity-70 hover:opacity-100 transition-opacity w-fit text-white">
                    <ArrowLeft size={18} />
                    <span className="text-xs font-medium">Back to dashboard</span>
                </Link>

                {/* Training Header - Micro label only, no H1 title */}
                <div className="mb-6 px-1">
                    <p className="m-0 text-[10px] font-black uppercase tracking-widest text-white/40">Training</p>
                </div>

                {/* Game Canvas Container */}
                <div className="flex justify-center w-full">
                    <RavenGame 
                        userId={activeUserId} 
                        personalBest={personalBest} 
                        onNewPb={(newScore) => setPersonalBest(newScore)} 
                    />
                </div>

                {/* Personal Best Stat Tile - Matching Profile Page Styling */}
                <div className="rounded-[32px] p-6 bg-[#1C1C1E] border border-white/10 shadow-sm mt-6 w-full">
                    <p className="m-0 mb-4 text-[10px] font-black uppercase tracking-widest text-white/40">Metrics</p>
                    <div className="grid grid-cols-1 gap-3">
                        <div className="rounded-[24px] p-4 bg-black/20 border border-white/5">
                            <p className="m-0 text-[10px] font-black uppercase tracking-widest text-white/40">Personal Best</p>
                            <p className="m-0 text-xl font-bold mt-2 text-white">
                                {personalBest !== null ? `${personalBest} reactions` : '—'}
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
