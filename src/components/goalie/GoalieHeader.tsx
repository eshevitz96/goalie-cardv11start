import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, Plus, LogOut, Bell, Search, ShieldCheck, Users, LayoutDashboard } from 'lucide-react';
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
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const { userId, userRole } = useAuth();
    const { theme } = useTheme();

    // Robust menu-switching logic to prevent overlap
    const toggleUserMenu = () => {
        setIsUserMenuOpen(prev => !prev);
        setIsNotificationsOpen(false);
    };

    const toggleNotifications = () => {
        setIsNotificationsOpen(prev => !prev);
        setIsUserMenuOpen(false);
    };

    return (
        <header className="sticky top-0 z-[100] bg-background/80 backdrop-blur-md -mx-4 px-4 py-3 mb-8 md:mb-12 md:relative md:top-auto md:bg-transparent md:backdrop-blur-none md:p-0 md:mx-0 flex justify-between items-center col-span-full gap-4 border-b border-white/5 md:border-none">
            <GlobalSearch
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                userId={userId || undefined}
            />

            <div className="flex flex-col justify-center">
                <BrandLogo />
            </div>
            
            <div className="flex items-center gap-3 md:gap-4">
                {/* Quick Access Shortcuts */}
                {userRole === 'admin' && (
                    <Link href="/admin">
                        <Button
                            variant="ghost"
                            size="sm"
                            title="Admin Portal"
                            className="h-9 w-9 md:h-10 md:w-10 rounded-full border border-border hover:border-indigo-500 hover:bg-indigo-500/10 p-0 transition-all"
                        >
                            <ShieldCheck size={16} className="text-indigo-500" />
                        </Button>
                    </Link>
                )}

                <Link href="/team">
                    <Button
                        variant="ghost"
                        size="sm"
                        title="Organization Hub"
                        className="h-9 w-9 md:h-10 md:w-10 rounded-full border border-border hover:border-primary hover:bg-primary/10 p-0 transition-all"
                    >
                        <Users size={16} className="text-primary" />
                    </Button>
                </Link>

                {/* Search Trigger */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSearchOpen(true)}
                    className="h-9 w-9 md:h-10 md:w-10 rounded-full border border-border hover:border-primary hover:bg-muted p-0 transition-colors"
                >
                    <Search size={16} className="text-muted-foreground hover:text-foreground" />
                </Button>

                {/* User Menu - Fixed for Mobile Tap */}
                <div className="relative z-50">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={toggleUserMenu}
                        className={`h-9 w-9 md:h-10 md:w-10 rounded-full border transition-all p-0 ${isUserMenuOpen ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary'}`}
                    >
                        <User size={16} className={isUserMenuOpen ? 'text-primary' : 'text-muted-foreground'} />
                    </Button>

                    <AnimatePresence>
                        {isUserMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl p-2 z-50 transform origin-top-right text-left"
                                >
                                    <div className="px-3 py-2 border-b border-border mb-1">
                                        <div className="text-sm font-bold text-foreground">Goalie Account</div>
                                        <div className="text-xs text-muted-foreground">{activeGoalieName}</div>
                                    </div>

                                    <Link onClick={() => setIsUserMenuOpen(false)} href="/dashboard/profile" className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                                        <Settings size={16} /> Account Settings
                                    </Link>
                                    
                                    {userRole === 'admin' && (
                                        <Link onClick={() => setIsUserMenuOpen(false)} href="/coach" className="w-full text-left px-3 py-2 rounded-lg text-sm text-primary font-bold hover:bg-primary/10 transition-colors flex items-center gap-2 mb-1">
                                            <ShieldCheck size={16} /> Admin Dashboard
                                        </Link>
                                    )}

                                    <Link onClick={() => setIsUserMenuOpen(false)} href="/activate" className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                                        <Plus size={16} /> Activate New Card
                                    </Link>
                                    
                                    <Link onClick={() => setIsUserMenuOpen(false)} href="/team" className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                                        <ShieldCheck size={16} /> Team Dashboard
                                    </Link>

                                    <div className="h-px bg-border my-1" />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => { setIsUserMenuOpen(false); onLogout(); }}
                                        className="w-full justify-start text-red-500 hover:bg-red-500/10"
                                    >
                                        <LogOut size={16} /> Sign Out
                                    </Button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {/* Notification Bell - Fixed for Mobile Tap */}
                <div className="relative z-50">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={toggleNotifications}
                        className={`h-9 w-9 md:h-10 md:w-10 rounded-full border transition-all p-0 relative ${isNotificationsOpen ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary'}`}
                    >
                        <Bell size={16} className={isNotificationsOpen || notifications.length > 0 ? 'text-primary' : 'text-muted-foreground'} />
                        {notifications.length > 0 && (
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-background" />
                        )}
                    </Button>

                    <AnimatePresence>
                        {isNotificationsOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl p-2 z-50 transform origin-top-right max-h-[70vh] overflow-y-auto"
                                >
                                    <div className="px-3 py-2 border-b border-border mb-1 flex justify-between items-center">
                                        <div className="text-sm font-bold text-foreground">Notifications</div>
                                        <span className="text-[10px] text-muted-foreground">{notifications.length} New</span>
                                    </div>
                                    {notifications.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-muted-foreground">No new notifications</div>
                                    ) : (
                                        notifications.map((n: any, i) => (
                                            <div key={i} className="px-3 py-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer border-b border-border/50 last:border-0 text-left">
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
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
