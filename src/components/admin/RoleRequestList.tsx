"use client";

import { useState, useEffect } from "react";
import { getPendingRoleRequests, grantRole, denyRoleRequest } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { Check, X, RefreshCw } from "lucide-react";
import { GoalieGuardLogo } from "@/components/ui/GoalieGuardLogo";
import { motion, AnimatePresence } from "framer-motion";

export function RoleRequestList() {
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRequests = async () => {
        setIsLoading(true);
        const res = await getPendingRoleRequests();
        if (res.success) {
            setRequests(res.data || []);
        } else {
            console.error(res.error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleGrant = async (userId: string, role: string) => {
        if (!confirm(`Grant '${role}' role to this user?`)) return;
        const res = await grantRole(userId, role);
        if (res.success) {
            alert(`Role '${role}' granted!`);
            fetchRequests();
        } else {
            alert("Error: " + res.error);
        }
    };

    const handleDeny = async (userId: string, role: string) => {
        if (!confirm(`Deny '${role}' request?`)) return;
        const res = await denyRoleRequest(userId, role);
        if (res.success) {
            fetchRequests();
        } else {
            alert("Error: " + res.error);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading requests...</div>;

    if (requests.length === 0) return (
        <div className="glass p-8 rounded-2xl text-center text-muted-foreground flex flex-col items-center gap-2 mb-8">
            <GoalieGuardLogo size={32} className="opacity-20" />
            <p>No pending role requests.</p>
            <Button variant="ghost" size="sm" onClick={fetchRequests} className="mt-2 text-xs">
                <RefreshCw size={12} className="mr-2" /> Refresh
            </Button>
        </div>
    );

    return (
        <div className="glass rounded-2xl p-6 mb-8 border-l-4 border-amber-500">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <GoalieGuardLogo className="text-amber-500" />
                    Pending Requests
                    <span className="bg-amber-500/10 text-amber-500 text-xs px-2 py-0.5 rounded-full">{requests.length}</span>
                </h2>
                <Button variant="ghost" size="sm" onClick={fetchRequests}>
                    <RefreshCw size={14} />
                </Button>
            </div>

            <div className="space-y-3">
                <AnimatePresence>
                    {requests.map((req) => (
                        req.requested_roles?.map((role: string) => (
                            <motion.div
                                key={`${req.id}-${role}`}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-background/50 border border-border p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4"
                            >
                                <div>
                                    <div className="font-bold text-foreground text-lg">{req.full_name || req.goalie_name || 'Unnamed User'}</div>
                                    <div className="text-sm text-muted-foreground">{req.email}</div>
                                    <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wide">
                                        Requesting: {role}
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <Button
                                        onClick={() => handleDeny(req.id, role)}
                                        className="flex-1 md:flex-none bg-red-500/10 text-red-500 hover:bg-red-500/20 border-0 h-10 px-6"
                                    >
                                        <X size={16} className="mr-2" /> Deny
                                    </Button>
                                    <Button
                                        onClick={() => handleGrant(req.id, role)}
                                        className="flex-1 md:flex-none bg-green-500 hover:bg-green-600 text-white border-0 h-10 px-6 font-bold"
                                    >
                                        <Check size={16} className="mr-2" /> Approve
                                    </Button>
                                </div>
                            </motion.div>
                        ))
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
