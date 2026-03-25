"use client";

import React from 'react';
import { User, Briefcase, Settings, Plus, LogOut, Bell, Search, Menu, X, Grid } from 'lucide-react';
import { GoalieGuardLogo } from '@/components/ui/GoalieGuardLogo';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { requestRole } from '@/app/actions';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { useAuth } from '@/hooks/useAuth';

interface DashboardHeaderProps {
    activeGoalieName: string;
    userRole?: string;
    onLogout: () => void;
    onClearNotifications?: () => void;
    notifications?: any[];
}

/**
 * Unified Dashboard Header
 * Shows user menu, notifications, and role-based navigation links
 */
export function DashboardHeader({
    activeGoalieName,
    userRole = 'goalie',
    onLogout,
    onClearNotifications,
    notifications = []
}: DashboardHeaderProps) {
    const [notificationsOpen, setNotificationsOpen] = React.useState(false);
    const [userMenuOpen, setUserMenuOpen] = React.useState(false);
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const { userId } = useAuth();

    // Close menus when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsOpen || userMenuOpen) {
                // simple check for demonstration; in robust apps, use a ref
                setNotificationsOpen(false);
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [notificationsOpen, userMenuOpen]);

    return (
        <header className="flex justify-between items-center mb-8 md:col-span-2 relative">
            <GlobalSearch
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                userId={userId || undefined}
            />

            <div className="flex flex-col">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Athlete Portal</span>
                <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity group">
                    <h1 className="text-2xl md:text-3xl font-black text-foreground italic tracking-tighter">
                        GOALIE <span className="text-primary">CARD</span>
                    </h1>
                </Link>
            </div>
            {/* DESKTOP NAV (Visible on md+) */}
            <div className="hidden md:flex items-center gap-4">
                {/* Search Trigger */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSearchOpen(true)}
                    className="h-10 w-10 rounded-full border border-border hover:border-primary hover:bg-muted p-0 transition-colors"
                >
                    <Search size={18} className="text-muted-foreground hover:text-foreground" />
                </Button>
                {/* Notification Bell */}
                <div className="relative z-50">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 rounded-full border border-border hover:border-primary p-0 relative"
                        onClick={(e) => { e.stopPropagation(); setNotificationsOpen(!notificationsOpen); setUserMenuOpen(false); }}
                    >
                        <Bell size={18} className={`text-muted-foreground ${notificationsOpen ? 'text-foreground' : ''} ${notifications.length > 0 ? 'text-primary' : ''}`} />
                        {notifications.length > 0 && (
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-background" />
                        )}
                    </Button>

                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl p-2 transition-all transform origin-top-right ${notificationsOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'} max-h-96 overflow-y-auto`}
                    >
                        <div className="px-3 py-2 border-b border-border mb-1 flex justify-between items-center">
                            <div className="text-sm font-bold text-foreground">Notifications</div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground">{notifications.length} New</span>
                                {notifications.length > 0 && onClearNotifications && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onClearNotifications(); }}
                                        className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors bg-primary/5 px-1.5 py-0.5 rounded"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                        </div>
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">No new notifications</div>
                        ) : (
                            notifications.map((n: any, i) => (
                                <div key={i} className="px-3 py-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer border-b border-border/50 last:border-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${n.type === 'lesson' ? 'bg-blue-500/10 text-blue-500' :
                                            n.type === 'event' ? 'bg-purple-500/10 text-purple-500' :
                                                'bg-green-500/10 text-green-500'
                                            }`}>{n.type || 'Update'}</span>
                                        <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-foreground leading-tight mb-1">{n.title}</h4>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* User Menu */}
                <div className="relative z-50">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 rounded-full border border-border hover:border-primary p-0"
                        onClick={(e) => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); setNotificationsOpen(false); }}
                    >
                        <User size={18} className={`text-muted-foreground ${userMenuOpen ? 'text-foreground' : ''}`} />
                    </Button>

                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl p-2 transition-all transform origin-top-right text-left ${userMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}
                    >
                        <div className="px-3 py-2 border-b border-border mb-1">
                            <div className="text-sm font-bold text-foreground">My Account</div>
                            <div className="text-xs text-muted-foreground">{activeGoalieName}</div>
                        </div>

                        {/* Admin Link */}
                        {userRole === 'admin' && (
                            <Link href="/admin" className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                                <GoalieGuardLogo size={16} /> Admin Control
                            </Link>
                        )}

                        {/* Coach Link */}
                        {(userRole === 'coach' || userRole === 'admin') && (
                            <Link href="/coach" className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                                <Briefcase size={16} /> Coach Mode
                            </Link>
                        )}

                        <Link href="/dashboard/profile" className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                            <Settings size={16} /> Account Settings
                        </Link>
                        <Link href="/activate" className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                            <Plus size={16} /> Link Access ID
                        </Link>

                        {/* Request Coach Access */}
                        {userRole !== 'coach' && userRole !== 'admin' && (
                            <button
                                onClick={async () => {
                                    if (!confirm("Request access to Coach OS?")) return;
                                    const result = await requestRole('coach');
                                    if (result.success) alert(result.message);
                                    else alert("Error: " + result.error);
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                            >
                                <Briefcase size={16} /> Enable Coach Mode
                            </button>
                        )}

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

            {/* MOBILE NAV (Consolidated) */}
            <div className="md:hidden relative z-[100]">
                <Button
                    variant="ghost"
                    size="sm"
                    className={`h-10 w-10 rounded-full border border-border p-0 transition-all ${isMobileMenuOpen ? 'bg-primary text-black border-primary scale-110 shadow-lg shadow-primary/20' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(!isMobileMenuOpen); }}
                >
                    {isMobileMenuOpen ? <X size={18} /> : <Grid size={18} />}
                </Button>

                <div
                    className={`absolute right-0 top-full mt-4 w-[280px] bg-card/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.5)] p-4 transition-all transform origin-top-right ${isMobileMenuOpen ? 'opacity-100 visible translate-y-0 scale-100' : 'opacity-0 invisible translate-y-4 scale-95'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {/* 4 Primary Mobile Actions in a 2x2 grid */}
                        <button 
                            onClick={() => { setIsSearchOpen(true); setIsMobileMenuOpen(false); }}
                            className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all active:scale-95"
                        >
                            <Search size={20} className="text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Search</span>
                        </button>

                        <button 
                            onClick={() => { setNotificationsOpen(true); setIsMobileMenuOpen(false); }}
                            className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all active:scale-95 relative"
                        >
                            <Bell size={20} className={notifications.length > 0 ? 'text-primary' : 'text-muted-foreground'} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alerts</span>
                            {notifications.length > 0 && <span className="absolute top-3 right-5 w-2 h-2 bg-red-500 rounded-full" />}
                        </button>

                        <Link 
                            href="/dashboard/profile"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all active:scale-95"
                        >
                            <Settings size={20} className="text-muted-foreground" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Setup</span>
                        </Link>

                        <button 
                            onClick={() => { setUserMenuOpen(true); setIsMobileMenuOpen(false); }}
                            className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all active:scale-95"
                        >
                            <User size={20} className="text-muted-foreground" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Account</span>
                        </button>
                    </div>

                    <div className="space-y-2">
                        {userRole === 'admin' && (
                            <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="w-full flex items-center justify-center gap-2 py-3 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                <GoalieGuardLogo size={14} /> Admin Access
                            </Link>
                        )}
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                            className="w-full py-3 text-red-500 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-widest"
                        >
                            <LogOut size={14} className="mr-2" /> Sign Out
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
