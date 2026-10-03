"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";
import { verifyCoachAuthorization } from "@/app/training/book/actions";

export default function CoachLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/login?next=/coach');
                return;
            }
            const coachAuth = await verifyCoachAuthorization();
            if (!coachAuth.isCoach) {
                router.replace('/dashboard');
                return;
            }
            setIsLoading(false);
        };

        checkAuth();
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return <>{children}</>;
}
