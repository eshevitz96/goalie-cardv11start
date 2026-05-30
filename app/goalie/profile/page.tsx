"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import ProfileContent from "./ProfileContent";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [goalie, setGoalie] = useState<any>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                const sessionEmail = user?.email;
                const localEmail = localStorage.getItem('user_email');
                const targetEmail = sessionEmail || localEmail;

                if (!targetEmail) {
                    router.push('/activate');
                    return;
                }

                // 1. Fetch primary roster entry
                const { data, error } = await supabase
                    .from('roster_uploads')
                    .select('*')
                    .ilike('email', targetEmail)
                    .limit(1)
                    .single();

                if (error || !data) {
                    console.error("Profile Fetch Error:", error);
                } else {
                    // 2. Parallel fetch: profile settings, coach, credits, transactions
                    const [profileRes, creditsRes, txRes] = await Promise.all([
                        data.linked_user_id
                            ? supabase.from('profiles').select('settings').eq('id', data.linked_user_id).single()
                            : Promise.resolve({ data: null }),
                        supabase.from('credit_transactions').select('amount').eq('roster_id', data.id),
                        supabase.from('credit_transactions')
                            .select('amount, description, created_at')
                            .eq('roster_id', data.id)
                            .order('created_at', { ascending: false })
                            .limit(20),
                    ]);

                    // 3. Coach name
                    let coachName: string | null = null;
                    if (data.assigned_coach_ids?.length > 0 || data.assigned_coach_id) {
                        const coachId = data.assigned_coach_ids?.[0] || data.assigned_coach_id;
                        const { data: coach } = await supabase
                            .from('roster_uploads')
                            .select('goalie_name')
                            .eq('id', coachId)
                            .single();
                        coachName = coach?.goalie_name || null;
                    }

                    // 4. Merge
                    data.team_history = profileRes.data?.settings?.team_history || [];
                    data.credits = creditsRes.data?.reduce((sum: number, c: any) => sum + c.amount, 0) || 0;
                    data.transactions = txRes.data || [];
                    data.coach_name = coachName;

                    setGoalie(data);
                }
            } catch (err) {
                console.error("Profile Load Error", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (!goalie) {
        return (
            <div className="min-h-screen bg-background text-foreground p-6 flex items-center justify-center flex-col gap-4">
                <p>Profile not found.</p>
                <button onClick={() => router.push('/activate')} className="bg-foreground text-background px-4 py-2 rounded-lg font-bold">
                    Go to Activation
                </button>
            </div>
        );
    }

    return <ProfileContent goalie={goalie} />;
}
