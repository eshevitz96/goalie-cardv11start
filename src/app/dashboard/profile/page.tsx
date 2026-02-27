"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import ProfileContent from "@/app/goalie/profile/ProfileContent";
import { Loader2 } from "lucide-react";

export default function DashboardProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [goalie, setGoalie] = useState<any>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // 1. Check Session (client-side, avoids middleware issues)
                const { data: { user } } = await supabase.auth.getUser();
                const sessionEmail = user?.email;
                const localEmail = localStorage.getItem('user_email');

                const targetEmail = sessionEmail || localEmail;

                if (!targetEmail) {
                    router.push('/login');
                    return;
                }

                // 2. Fetch Roster Data
                const { data, error } = await supabase
                    .from('roster_uploads')
                    .select('*')
                    .ilike('email', targetEmail)
                    .single();

                if (error || !data) {
                    console.error("Profile Fetch Error:", error);
                } else {
                    // Map goalie_name to name for ProfileContent component
                    setGoalie({
                        ...data,
                        name: data.goalie_name
                    });
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
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
            </div>
        );
    }

    if (!goalie) {
        return (
            <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center flex-col gap-4">
                <p>Profile not found.</p>
                <button onClick={() => router.push('/dashboard')} className="bg-white text-black px-4 py-2 rounded-lg font-bold">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return <ProfileContent goalie={goalie} />;
}
