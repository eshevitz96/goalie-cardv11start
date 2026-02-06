import React from 'react';
import { User, Shield, Briefcase, Settings, Plus, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface ParentHeaderProps {
    activeGoalieName: string;
    auth: any;
    onLogout: () => void;
}

export function ParentHeader({ activeGoalieName, auth, onLogout }: ParentHeaderProps) {
    return (
        <header className="flex justify-between items-center mb-8 md:col-span-2">
            <div className="flex flex-col">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Athlete Portal</span>
                <h1 className="text-2xl md:text-3xl font-black text-foreground italic tracking-tighter">
                    GOALIE <span className="text-primary">CARD</span>
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative group z-50">
                    <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full border border-border hover:border-primary p-0">
                        <User size={18} className="text-muted-foreground group-hover:text-foreground" />
                    </Button>

                    <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right translate-y-2 group-hover:translate-y-0">
                        <div className="px-3 py-2 border-b border-border mb-1">
                            <div className="text-sm font-bold text-foreground">Goalie Account</div>
                            <div className="text-xs text-muted-foreground">{activeGoalieName}</div>
                        </div>

                        {auth.userRole === 'admin' && (
                            <Link href="/admin" className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                                <Shield size={16} /> Admin Control
                            </Link>
                        )}

                        {(auth.userRole === 'coach' || auth.userRole === 'admin') && (
                            <Link href="/coach" className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                                <Briefcase size={16} /> Coach Mode
                            </Link>
                        )}

                        <Link href="/parent/profile" className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                            <Settings size={16} /> Account Settings
                        </Link>
                        <Link href="/activate" className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                            <Plus size={16} /> Link Access ID
                        </Link>


                        <div className="h-px bg-border my-1" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onLogout}
                            className="w-full justify-start text-red-500 hover:bg-red-500/10"
                        >
                            <LogOut size={16} /> Sign Out
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
