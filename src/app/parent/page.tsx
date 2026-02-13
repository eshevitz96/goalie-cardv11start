"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useParentData } from "@/hooks/useParentData";
import { useAuth } from "@/hooks/useAuth";

// Components
import { ParentDashboard } from "@/components/parent/ParentDashboard";
import { transformGoalieData } from "@/lib/transformers/goalie-transformers";

export default function ParentPage() {
  const router = useRouter();
  const { userRole, logout } = useAuth();
  const { goalies: rawGoalies, isLoading, fetchMyGoalies } = useParentData();

  // Apply Transformation Layer
  const goalies = rawGoalies.map(transformGoalieData).filter(Boolean);

  // Local UI State - Notifications only needed here for now
  const [notification, setNotification] = useState<{ id: string, title: string, message: string, type?: string } | null>(null);

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to sign out?")) return;
    await logout();
    router.push('/login');
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-foreground"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  if (goalies.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">No Goalie Card Found</h2>
        <p className="text-zinc-400 mb-8">We couldn't find a roster spot linked to this account.</p>
        <Link href="/activate" className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
          Activate My Card
        </Link>
      </div>
    );
  }

  return (
    <ParentDashboard
      goalies={goalies}
      userRole={userRole}
      isLoading={isLoading}
      notification={notification}
      onDismissNotification={() => setNotification(null)}
      onLogout={handleLogout}
      onRefreshData={() => fetchMyGoalies(false)}
    />
  );
}
