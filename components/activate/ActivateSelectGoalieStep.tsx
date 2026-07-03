"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, User, ArrowLeft, AlertCircle } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { clsx } from "clsx";

interface ActivateSelectGoalieStepProps {
    rosters: any[];
    onSelect: (rosterId: string) => void;
    onBack: () => void;
    isLoading: boolean;
}

export function ActivateSelectGoalieStep({ rosters, onSelect, onBack, isLoading }: ActivateSelectGoalieStepProps) {
    const router = useRouter();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedId) {
            onSelect(selectedId);
        }
    };

    const allClaimed = rosters.every(r => r.is_claimed);

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mb-6 flex flex-col items-start gap-4">
                <BrandLogo />
                <h2 className="text-xl font-bold text-foreground/80 tracking-tight">
                    Select Your Goalie Card
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed text-left">
                    We found multiple goalies registered under your email. Please select which card is yours:
                </p>
            </div>

            {allClaimed && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-4 rounded-xl text-xs font-semibold leading-relaxed text-left flex items-start gap-2 animate-in fade-in duration-300">
                    <AlertCircle className="shrink-0 mt-0.5" size={14} />
                    <span>
                        All goalie cards associated with this email have already been claimed. If you already created your account, please log in to access your dashboard.
                    </span>
                </div>
            )}

            <div className="space-y-3">
                {rosters.map((roster) => {
                    const isSelected = selectedId === roster.id;
                    const isClaimed = roster.is_claimed;

                    return (
                        <div
                            key={roster.id}
                            onClick={() => {
                                if (!isClaimed) {
                                    setSelectedId(roster.id);
                                }
                            }}
                            className={clsx(
                                "flex items-center justify-between p-4 rounded-xl border transition-all shadow-sm",
                                isClaimed
                                    ? "bg-secondary/20 border-border/40 opacity-50 cursor-not-allowed"
                                    : isSelected
                                    ? "bg-primary/10 border-primary cursor-pointer ring-2 ring-primary/20"
                                    : "bg-card border-border hover:border-primary/50 cursor-pointer"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={clsx(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                                    isSelected ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                                )}>
                                    <User size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm text-foreground">{roster.goalie_name}</p>
                                    <p className="text-xs text-muted-foreground">{roster.sport || 'Hockey'} Goalie</p>
                                </div>
                            </div>
                            
                            {isClaimed && (
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-800/80 px-2.5 py-1 rounded-full">
                                    Claimed
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-4 pt-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex-1 py-4 bg-secondary border border-border hover:bg-secondary/80 text-foreground font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                    <ArrowLeft size={16} /> Back
                </button>
                {allClaimed ? (
                    <button
                        type="button"
                        onClick={() => router.push('/login')}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                        Log In <ArrowRight size={16} />
                    </button>
                ) : (
                    <button
                        type="submit"
                        disabled={!selectedId || isLoading}
                        className="flex-1 bg-foreground hover:bg-foreground/90 text-background font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <>Continue <ArrowRight size={16} /></>}
                    </button>
                )}
            </div>
        </form>
    );
}
