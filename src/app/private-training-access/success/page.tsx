"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
    CheckCircle2, 
    ArrowRight, 
    Home, 
    ShieldCheck, 
    CreditCard, 
    User, 
    Mail, 
    Phone,
    Calendar,
    ChevronDown,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import { getSubmissionById } from "../actions";

export default function PrivateTrainingSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const submissionId = searchParams.get('submission_id');
    const sessionId = searchParams.get('session_id');
    
    const [submission, setSubmission] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSubmission = async () => {
            if (submissionId) {
                const data = await getSubmissionById(submissionId);
                setSubmission(data);
            }
            setIsLoading(false);
        };
        fetchSubmission();
    }, [submissionId]);

    if (isLoading) {
        return (
            <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <Loader2 className="animate-spin text-primary opacity-50" size={40} />
                <p className="mt-4 text-xs font-black uppercase tracking-widest text-muted-foreground/60">Confirming Enrollment...</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500/30 via-emerald-500/30 to-teal-500/30" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-green-500/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="w-full max-w-lg relative z-10 transition-all duration-500">
                <div className="text-center mb-8 flex flex-col items-center">
                    <BrandLogo
                        size={40}
                        textClassName="text-3xl md:text-4xl font-medium tracking-tight mb-2"
                    />
                    <div className="flex items-center gap-2 text-emerald-500 text-sm uppercase tracking-[0.2em] font-black">
                        <CheckCircle2 size={12} className="opacity-80" />
                        Enrollment Complete
                    </div>
                </div>

                <div className="bg-card/20 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] p-8 md:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.15)] relative overflow-hidden ring-1 ring-white/10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-10"
                    >
                        <div className="space-y-4 text-center">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">You’re in.</h2>
                            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                                Your access has been confirmed. A receipt has been sent to your email. Next steps for scheduling will follow directly.
                            </p>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-secondary/40 border border-border/50 rounded-3xl p-8 space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <BrandLogo size={120} />
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60 mb-0.5">Athlete</p>
                                    <h4 className="text-lg font-bold">{submission?.athlete_name || 'Confirmed Athlete'}</h4>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-2 border-t border-border/30">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-black text-muted-foreground/50">
                                        <ShieldCheck size={10} /> Waiver
                                    </div>
                                    <p className="text-xs font-bold text-emerald-500">Confirmed</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-black text-muted-foreground/50">
                                        <CreditCard size={10} /> Payment
                                    </div>
                                    <p className="text-xs font-bold text-emerald-500">Authorized</p>
                                </div>
                            </div>

                            <div className="space-y-1 pt-4 border-t border-border/30">
                                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-black text-muted-foreground/50">
                                    <Mail size={10} /> Contact Email
                                </div>
                                <p className="text-xs font-bold truncate">{submission?.email || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <Button
                                onClick={() => router.push('/')}
                                variant="outline"
                                className="w-full py-6 rounded-2xl group border-border/40 hover:bg-secondary/50 transition-all font-black text-[11px] uppercase tracking-[0.2em]"
                            >
                                <Home size={14} className="mr-2 opacity-50" /> Return Home
                            </Button>
                        </div>
                    </motion.div>
                </div>
                
                <p className="mt-8 text-center text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/30">
                    The Goalie Brand © 2026 • Welcome to the Team
                </p>
            </div>
        </main>
    );
}
