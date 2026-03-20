import React, { useState } from 'react';
import { User, Settings, Plus, LogOut, Bell, Search, ShieldCheck } from 'lucide-react';
import { BrandLogo } from "@/components/ui/BrandLogo";
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { useAuth } from '@/hooks/useAuth';

interface GoalieHeaderProps {
    activeGoalieName: string;
    onLogout: () => void;
    notifications: any[];
}

export function GoalieHeader({ activeGoalieName, onLogout, notifications }: GoalieHeaderProps) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { userId } = useAuth();
    const { theme } = useTheme();

    return (
        <header className="flex justify-between items-center mb-12 col-span-full relative">
            <GlobalSearch
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                userId={userId || undefined}
            />

            <div className="flex flex-col justify-center">
                <BrandLogo />
            </div>
            <div className="flex items-center gap-3 md:gap-4">
                {/* Search Trigger */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSearchOpen(true)}
                    className="h-10 w-10 rounded-full border border-border hover:border-primary hover:bg-muted p-0 transition-colors"
                >
                    <Search size={18} className="text-muted-foreground hover:text-foreground" />
                </Button>

                {/* User Menu */}
                <div className="relative group z-30">
                    <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full border border-border hover:border-primary p-0">
                        <User size={18} className="text-muted-foreground group-hover:text-foreground" />
                    </Button>

                    <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right translate-y-2 group-hover:translate-y-0 text-left">
                        <div className="px-3 py-2 border-b border-border mb-1">
                            <div className="text-sm font-bold text-foreground">Goalie Account</div>
                            <div className="text-xs text-muted-foreground">{activeGoalieName}</div>
                        </div>

                        <Link href="/dashboard/profile" className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                            <Settings size={16} /> Account Settings
                        </Link>
                        <Link href="/activate" className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                            <Plus size={16} /> Activate New Card
                        </Link>
                        <Link href="/team" className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                            <ShieldCheck size={16} /> Team Dashboard
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

                {/* Notification Bell */}
                <div className="relative group z-50">
                    <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full border border-border hover:border-primary p-0 relative">
                        <Bell size={18} className={`text-muted-foreground group-hover:text-foreground ${notifications.length > 0 ? 'text-primary' : ''}`} />
                        {notifications.length > 0 && (
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-background" />
                        )}
                    </Button>

                    <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right translate-y-2 group-hover:translate-y-0 max-h-96 overflow-y-auto">
                        <div className="px-3 py-2 border-b border-border mb-1 flex justify-between items-center">
                            <div className="text-sm font-bold text-foreground">Notifications</div>
                            <span className="text-[10px] text-muted-foreground">{notifications.length} New</span>
                        </div>
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">No new notifications</div>
                        ) : (
                            notifications.map((n: any, i) => (
                                <div key={i} className="px-3 py-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer border-b border-border/50 last:border-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <Badge
                                            variant={n.type === 'lesson' ? 'secondary' : n.type === 'event' ? 'outline' : 'default'}
                                            className="text-[10px] uppercase pointer-events-none"
                                        >
                                            {n.type || 'Update'}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-foreground leading-tight mb-1">{n.title}</h4>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
