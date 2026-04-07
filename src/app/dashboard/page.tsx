"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";

import { useParentData } from "@/hooks/useParentData";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import { useTheme } from "next-themes";
import { supabase } from "@/utils/supabase/client";
import { getUserType } from "@/utils/user-type";
import { SplashLoader, InlineLoader } from "@/components/ui/Loaders";

import { PaymentList } from "@/components/PaymentList";
import { ScheduleRequest } from "@/components/ScheduleRequest";
import { PostGameReport } from "@/components/PostGameReport";
import { Reflections } from "@/components/Reflections";
import { AiCoachRecommendation } from "@/components/AiCoachRecommendation";
import { BetaFeedback } from "@/components/BetaFeedback";
import { WhatsNewGuide } from "@/components/WhatsNewGuide";
import { EventsList } from "@/components/EventsList";
import { Button } from "@/components/ui/Button";
import { GoalieCard } from "@/components/GoalieCard";
import TrainingInsights from "@/components/TrainingInsights";
import { GoalsWidget } from "@/components/GoalsWidget";
import { GoalieDashboard } from "@/components/goalie/GoalieDashboard";

/**
 * Unified Dashboard - replaces both /parent and /goalie portals
 * Role-based features determined by isOwner and isPro flags
 */
export default function Dashboard() {
    const router = useRouter();
    const toast = useToast();
    const auth = useAuth();
    const { theme } = useTheme();
    const { goalies, isLoading, error, fetchMyGoalies } = useParentData();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const refreshData = async (showRefreshIndicator = true) => {
        if (showRefreshIndicator) setIsRefreshing(true);
        await fetchMyGoalies(false);
        setIsRefreshing(false);
    };

    // Redirect if not authenticated
    useEffect(() => {
        if (!auth.loading && !auth.isAuthenticated && !isLoggingOut) {
            router.push('/login');
        }
    }, [auth.loading, auth.isAuthenticated, isLoggingOut, router]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await auth.logout();
        router.push('/login');
    };

    const handleRegisterGoalie = async () => {
        const goalieName = prompt("Enter Goalie Full Name:");
        if (!goalieName) return;

        const sport = prompt("Enter Sport (Hockey or Lacrosse):", auth.userSport || "Hockey") || "Hockey";

        try {
            const { addNewGoalieToAccount } = await import('@/app/actions');
            const result = await addNewGoalieToAccount(auth.userId!, goalieName, sport);
            if (result.success) {
                toast.success(`Card provisioned for ${goalieName}! Registering your new Hub...`);
                fetchMyGoalies(true);
            } else {
                toast.error(result.error || "Failed to add goalie");
            }
        } catch (err) {
            toast.error("Failed to register new goalie card.");
        }
    }

    // Fetch notifications on mount
    useEffect(() => {
        // Redirect admins to the admin portal if they land here
        // Skip redirect if ?view=goalie is set (preview mode for admin)
        const viewParam = typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('view')
            : null;
        if (auth.userRole === 'admin' && viewParam !== 'goalie') {
            router.replace('/admin');
            return;
        }
    }, [auth.userRole]);

    // Full screen load
    if (isLoading) return <SplashLoader />;

    // Profile still syncing
    if (goalies.length === 0) return <SplashLoader />;

    return (
        <Suspense fallback={<SplashLoader />}>
            <GoalieDashboard 
                goalies={goalies} 
                userRole={auth.userRole || 'goalie'} 
                userId={auth.userId || null}
                userSport={auth.userSport}
                notification={null}
                notifications={[]}
                onDismissNotification={() => {}}
                onLogout={handleLogout}
                onRegister={handleRegisterGoalie}
                onLogAction={() => refreshData(false)}
                onCoachUpdate={() => refreshData(true)}
                journalPrefill={null}
                isDataLoading={isLoading}
            />
            <InlineLoader visible={isRefreshing} />
        </Suspense>
    );
}
