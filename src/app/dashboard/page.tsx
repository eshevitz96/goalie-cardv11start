"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Bell } from "lucide-react";

import { useParentData } from "@/hooks/useParentData";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import { useTheme } from "next-themes";
import { supabase } from "@/utils/supabase/client";
import { getUserType } from "@/utils/user-type";
import { BrandLogo } from "@/components/ui/BrandLogo";

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

    const handleRegisterGoalie = async () => {
        const goalieName = prompt("Enter Goalie Full Name:");
        if (!goalieName) return;

        const sport = prompt("Enter Sport (Hockey or Lacrosse):", "Hockey") || "Hockey";

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
        if (auth.userRole === 'admin') {
            router.replace('/admin');
            return;
        }
    }, [auth.userRole]);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground gap-8 transition-colors duration-500">
                <BrandLogo textClassName="text-3xl font-medium tracking-tight" />
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-primary/30" size={32} />
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] animate-pulse">Initializing V11 Hub</p>
                </div>
            </div>
        );
    }

    // Data loading or no goalies found
    if (goalies.length === 0) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground gap-8 transition-colors duration-500">
                <BrandLogo textClassName="text-3xl font-medium tracking-tight" />
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-primary/30" size={32} />
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] animate-pulse">Syncing Active Profile</p>
                </div>
            </div>
        );
    }

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground gap-8 transition-colors duration-500">
                <BrandLogo textClassName="text-3xl font-medium tracking-tight" />
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-primary/30" size={32} />
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] animate-pulse">Preparing Hub</p>
                </div>
            </div>
        }>
            <GoalieDashboard 
                goalies={goalies} 
                userRole={auth.userRole || 'goalie'} 
                userId={auth.userId || null}
                notification={null}
                notifications={[]}
                onDismissNotification={() => {}}
                onLogout={() => auth.logout()}
                onRegister={handleRegisterGoalie}
                onLogAction={() => fetchMyGoalies(false)}
                onCoachUpdate={() => fetchMyGoalies(false)}
                journalPrefill={null}
            />
        </Suspense>
    );
}
