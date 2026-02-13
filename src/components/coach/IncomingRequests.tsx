"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Check, X, Clock, User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { schedulingService } from "@/services/scheduling";

interface ScheduleRequest {
    id: string;
    goalie_id: string;
    goalie_name: string;
    requested_date: string;
    note?: string;
    status: string;
    created_at: string;
}

interface IncomingRequestsProps {
    coachId: string;
}

export function IncomingRequests({ coachId }: IncomingRequestsProps) {
    const toast = useToast();
    const [requests, setRequests] = useState<ScheduleRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, [coachId]);

    const fetchRequests = async () => {
        try {
            const data = await schedulingService.fetchIncomingRequests(coachId);
            setRequests(data);
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (requestId: string) => {
        setProcessingId(requestId);
        try {
            // Use Server Action for Secure Processing
            const { processScheduleRequest } = await import("@/app/credits/actions");
            const result = await processScheduleRequest(requestId, 'confirmed');

            if (!result.success) throw new Error(result.error);

            toast.success("Session confirmed!");
            fetchRequests();
        } catch (error: any) {
            toast.error("Failed to confirm: " + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDecline = async (requestId: string) => {
        if (!confirm("Decline this session request? This will refund the user's credit.")) return;

        setProcessingId(requestId);
        try {
            // Use Server Action for Auto-Refund
            const { processScheduleRequest } = await import("@/app/credits/actions");
            const result = await processScheduleRequest(requestId, 'declined');

            if (!result.success) throw new Error(result.error);

            toast.warning("Request declined & Credit refunded.");
            fetchRequests();
        } catch (error: any) {
            toast.error("Failed to decline: " + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="glass rounded-3xl p-6">
                <div className="text-center text-muted-foreground text-sm py-4">
                    Loading requests...
                </div>
            </div>
        );
    }

    return (
        <div className="glass rounded-3xl p-6 relative overflow-hidden">
            {/* Decorative element */}
            <div className="absolute top-0 right-0 -mt-6 -mr-6 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Calendar size={18} className="text-primary" />
                    Incoming Requests
                    {requests.length > 0 && (
                        <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full">
                            {requests.length}
                        </span>
                    )}
                </h3>
            </div>

            <div className="space-y-3 relative z-10">
                {requests.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-4">
                        No pending session requests
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {requests.map((req) => (
                            <motion.div
                                key={req.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-4 bg-muted/40 border border-border rounded-xl group hover:border-primary/50 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                                            <User size={16} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground text-sm">
                                                {req.goalie_name}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                <Clock size={12} />
                                                {new Date(req.requested_date).toLocaleDateString(undefined, {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })} @ {new Date(req.requested_date).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                </div>

                                {req.note && (
                                    <div className="mb-3 p-2 bg-background/50 rounded-lg border border-border/50">
                                        <div className="flex items-start gap-2">
                                            <MessageSquare size={12} className="text-muted-foreground mt-0.5" />
                                            <p className="text-xs text-muted-foreground italic">
                                                "{req.note}"
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleAccept(req.id)}
                                        disabled={processingId === req.id}
                                        className="flex-1 flex items-center justify-center gap-2"
                                    >
                                        <Check size={14} />
                                        {processingId === req.id ? "..." : "Confirm"}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDecline(req.id)}
                                        disabled={processingId === req.id}
                                        className="flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                                    >
                                        <X size={14} />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
