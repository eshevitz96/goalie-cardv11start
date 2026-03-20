"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Bell } from "lucide-react";

import { useParentData } from "@/hooks/useParentData";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import { supabase } from "@/utils/supabase/client";
import { getUserType } from "@/utils/user-type";

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
    const { goalies, isLoading, error, fetchMyGoalies } = useParentData();

    const [currentIndex, setCurrentIndex] = useState(0);

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
            <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    // Data loading or no goalies found
    if (goalies.length === 0) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
                    Synchronizing Goalie Card...
                </p>
            </div>
        );
    }

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
                    Preparing Dashboard...
                </p>
            </div>
        }>
            <GoalieDashboard 
                goalies={goalies} 
                userRole={auth.userRole || 'goalie'} 
                userId={auth.userId || null}
                notification={null}
                notifications={[]}
                onDismissNotification={() => {}}
                onLogout={() => router.push('/login')}
                onRegister={() => {}}
                onLogAction={() => {}}
                onCoachUpdate={() => {}}
                journalPrefill={null}
            />
        </Suspense>
    );
}
