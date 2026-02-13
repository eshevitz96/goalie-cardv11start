import React from 'react';
import { Bell, Check, Calendar, Trophy, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'alert' | 'lesson' | 'event' | 'info'; // Adapt based on actual data
    created_at: string;
    is_read?: boolean;
}

interface NotificationsWidgetProps {
    notifications: Notification[];
    onMarkAsRead?: (id: string) => void;
    onClearAll?: () => void;
}

export function NotificationsWidget({ notifications, onMarkAsRead, onClearAll }: NotificationsWidgetProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'alert': return <AlertCircle size={16} className="text-red-500" />;
            case 'lesson': return <Trophy size={16} className="text-blue-500" />;
            case 'event': return <Calendar size={16} className="text-purple-500" />;
            default: return <Bell size={16} className="text-gray-500" />;
        }
    };

    return (
        <Card className="h-full flex flex-col bg-card/60 backdrop-blur-xl border-white/10">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Bell size={16} /> Notifications
                </CardTitle>
                {notifications.length > 0 && onClearAll && (
                    <Button variant="ghost" size="sm" onClick={onClearAll} className="h-auto p-1 text-[10px] text-muted-foreground hover:text-foreground">
                        Clear All
                    </Button>
                )}
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0 px-4 pb-4 custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                        <Bell size={32} className="mb-2" />
                        <p className="text-xs">No new notifications</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence>
                            {notifications.map((n) => (
                                <motion.div
                                    key={n.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group relative"
                                >
                                    <div className="flex gap-3 items-start">
                                        <div className="mt-1 bg-white/5 p-1.5 rounded-lg">
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <h4 className="text-sm font-bold text-foreground truncate pr-6">{n.title}</h4>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {new Date(n.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                {n.message}
                                            </p>
                                        </div>
                                    </div>
                                    {onMarkAsRead && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onMarkAsRead(n.id)}
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 rounded-full hover:bg-white/10"
                                            title="Mark as read"
                                        >
                                            <Check size={12} className="text-muted-foreground hover:text-green-500" />
                                        </Button>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
