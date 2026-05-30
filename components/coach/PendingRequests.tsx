import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { Check, X, Loader2, UserPlus } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export function PendingRequests() {
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const toast = useToast();

    const fetchRequests = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('coach_requests')
            .select(`
                id,
                goalie_why,
                status,
                created_at,
                roster_uploads (
                    id,
                    goalie_name,
                    grad_year,
                    team,
                    session_count,
                    lesson_count
                )
            `)
            .eq('coach_id', user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching requests:", error);
        } else {
            setRequests(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleDecision = async (requestId: string, rosterId: string, decision: 'approved' | 'denied') => {
        setProcessingId(requestId);

        try {
            const newStatus = decision === 'approved' ? 'approved_pending_payment' : 'denied';

            // 1. Update the request status
            const { error: reqError } = await supabase
                .from('coach_requests')
                .update({ status: newStatus })
                .eq('id', requestId);

            if (reqError) throw reqError;

            // 2. Note: We DO NOT update the roster_uploads here if approved.
            // The Stripe Webhook will handle the actual roster assignment
            // once the checkout is completed.

            toast.success(decision === 'approved' ? 'Goalie Approved! They will be notified to checkout.' : 'Request Declined.');

            // Remove from local state
            setRequests(prev => prev.filter(r => r.id !== requestId));

        } catch (error: any) {
            console.error("Decision error:", error);
            toast.error("Failed to process decision: " + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="glass rounded-3xl p-6 flex justify-center py-12">
                <Loader2 className="animate-spin text-primary" />
            </div>
        );
    }

    if (requests.length === 0) return null;

    return (
        <div className="glass rounded-3xl p-6 relative overflow-hidden border border-primary/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <UserPlus size={18} className="text-primary" />
                Pro Tier Requests
                <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full">{requests.length}</span>
            </h3>

            <div className="space-y-4 relative z-10">
                {requests.map((req) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={req.id}
                        className="p-4 bg-background border border-border rounded-xl space-y-3"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-foreground text-lg leading-none mb-1">
                                    {req.roster_uploads?.goalie_name}
                                </h4>
                                <div className="text-xs text-muted-foreground font-medium">
                                    {req.roster_uploads?.team} • Class of {req.roster_uploads?.grad_year}
                                </div>
                            </div>
                            <div className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
                                {new Date(req.created_at).toLocaleDateString()}
                            </div>
                        </div>

                        {/* Pitch */}
                        <div className="bg-muted p-3 rounded-lg text-sm text-foreground/90 italic border-l-2 border-primary">
                            "{req.goalie_why}"
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => handleDecision(req.id, req.roster_uploads.id, 'denied')}
                                disabled={processingId === req.id}
                                className="flex-1 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                <X size={14} /> Decline
                            </button>
                            <button
                                onClick={() => handleDecision(req.id, req.roster_uploads.id, 'approved')}
                                disabled={processingId === req.id}
                                className="flex-1 py-2 rounded-lg bg-emerald-500 border border-emerald-400 text-emerald-950 text-xs font-black transition-transform hover:scale-[1.02] flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {processingId === req.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve ($300/mo)
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
