import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { User, FileText, Loader2 } from 'lucide-react';
import { GoalieGuardLogo } from '@/components/ui/GoalieGuardLogo';

import { UserRole } from '@/types';

interface AuthRoutingStepProps {
    showRoleSelector: boolean;
    userRoles?: UserRole[];
}

export function AuthRoutingStep({ showRoleSelector, userRoles = [] }: AuthRoutingStepProps) {
    const router = useRouter();

    const hasRole = (role: UserRole) => userRoles.includes(role) || userRoles.includes('admin');

    return (
        <motion.div
            key="routing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-6 w-full"
        >
            {showRoleSelector ? (
                <div className="w-full space-y-4">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Command Center</h2>
                        <p className="text-zinc-500 text-xs font-mono">Select your workspace</p>
                    </div>

                    {hasRole('admin') && (
                        <Button variant="ghost" onClick={() => router.replace('/admin')} className="w-full p-6 bg-zinc-900 border border-zinc-800 hover:border-white hover:bg-black rounded-2xl group transition-all text-left relative overflow-hidden h-auto block">
                            <div className="absolute right-4 top-4 opacity-20 group-hover:opacity-100 transition-opacity">
                                <GoalieGuardLogo className="text-white" size={32} />
                            </div>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Master Control</p>
                            <h3 className="text-lg font-bold text-white">Admin Console</h3>
                        </Button>
                    )}

                    {hasRole('coach') && (
                        <Button variant="ghost" onClick={() => router.replace('/coach')} className="w-full p-6 bg-zinc-900 border border-zinc-800 hover:border-primary hover:bg-black rounded-2xl group transition-all text-left relative overflow-hidden h-auto block">
                            <div className="absolute right-4 top-4 opacity-20 group-hover:opacity-100 transition-opacity">
                                <User className="text-primary" size={32} />
                            </div>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Coach OS</p>
                            <h3 className="text-lg font-bold text-white">Coaching Portal</h3>
                        </Button>
                    )}

                    {(hasRole('goalie') || hasRole('parent')) && (
                        <Button variant="ghost" onClick={() => router.replace('/goalie')} className="w-full p-6 bg-zinc-900 border border-zinc-800 hover:border-emerald-500 hover:bg-black rounded-2xl group transition-all text-left relative overflow-hidden h-auto block">
                            <div className="absolute right-4 top-4 opacity-20 group-hover:opacity-100 transition-opacity">
                                <FileText className="text-emerald-500" size={32} />
                            </div>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Player Card</p>
                            <h3 className="text-lg font-bold text-white">Goalie Dashboard</h3>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                    <h2 className="text-xl font-bold text-white animate-pulse">Establishing Connection...</h2>
                </div>
            )}
        </motion.div>
    );
}
