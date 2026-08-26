"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { X, Target } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { usePathname } from "next/navigation";

export function WeeklyContractWidget() {
    const auth = useAuth();
    const pathname = usePathname();
    const [intention, setIntention] = useState<string | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Don't show on login/onboarding or week intention setting itself
    const hiddenRoutes = ['/login', '/onboarding', '/calendar/week'];
    const shouldHide = hiddenRoutes.includes(pathname || '');

    useEffect(() => {
        if (!auth.userId || auth.userId === "00000000-0000-0000-0000-000000000000" || shouldHide) return;

        const fetchIntention = async () => {
            const today = new Date();
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(today.setDate(diff));
            monday.setHours(0, 0, 0, 0);
            
            const weekStr = monday.toISOString().split("T")[0];

            try {
                const { data, error } = await supabase
                    .from('weekly_intentions')
                    .select('intention_text')
                    .eq('user_id', auth.userId)
                    .gte('week_start', weekStr)
                    .order('week_start', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (!error && data?.intention_text) {
                    setIntention(data.intention_text);
                    // Slight delay for smooth entrance
                    setTimeout(() => setIsVisible(true), 500);
                }
            } catch (err) {
                console.error("Failed to fetch intention for widget:", err);
            }
        };

        fetchIntention();
    }, [auth.userId, shouldHide]);

    if (!intention || dismissed || shouldHide) return null;

    return (
        <div 
            className={twMerge(
                "fixed bottom-[calc(env(safe-area-inset-bottom)+80px)] right-4 md:bottom-6 md:right-6 z-[90] max-w-[280px] sm:max-w-[320px]",
                "transition-all duration-700 ease-out transform",
                isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            )}
        >
            <div className="bg-[#18181B] border border-white/5 border-l-4 border-l-[#00E676] rounded-2xl shadow-2xl p-4 md:p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => setDismissed(true)}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors text-zinc-500 hover:text-white"
                    >
                        <X size={14} />
                    </button>
                </div>
                
                <div className="flex items-start gap-3">
                    <div className="mt-1 p-1.5 bg-[#00E676]/10 rounded-lg shrink-0">
                        <Target size={14} className="text-[#00E676]" />
                    </div>
                    <div className="flex-1 pr-6">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">
                            Active Contract
                        </span>
                        <p className="text-sm font-bold text-white leading-snug">
                            "{intention}"
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
